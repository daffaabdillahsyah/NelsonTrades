import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import JournalCard from '@/components/JournalCard'
import WinrateCircle from '@/components/WinrateCircle'
import PairStats from '@/components/PairStats'
import TradeCalendar from '@/components/TradeCalendar'
import Link from 'next/link'
import { NotebookPen } from 'lucide-react'

export const metadata = { title: 'Journal — NST Bootcamp' }

export default async function JournalPage({ searchParams }) {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? '1'))
  const limit = 10

  const session = await getServerSession(authOptions)
  const userId = session.user.id

  const [entries, total, wins, losses, be, allEntries, winTrades, lossTrades, rrEntries, bestTrade, worstTrade] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { tradeDate: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.journalEntry.count({ where: { userId } }),
    prisma.journalEntry.count({ where: { userId, result: 'WIN' } }),
    prisma.journalEntry.count({ where: { userId, result: 'LOSS' } }),
    prisma.journalEntry.count({ where: { userId, result: 'BE' } }),
    prisma.journalEntry.findMany({
      where: { userId },
      select: { id: true, pair: true, result: true, pnl: true, tradeDate: true, direction: true },
      orderBy: { tradeDate: 'desc' },
    }),
    prisma.journalEntry.findMany({
      where: { userId, result: 'WIN' },
      select: { pnl: true, fundedAccount: { select: { accountSize: true, currency: true } } },
    }),
    prisma.journalEntry.findMany({
      where: { userId, result: 'LOSS' },
      select: { pnl: true, fundedAccount: { select: { accountSize: true, currency: true } } },
    }),
    prisma.journalEntry.findMany({
      where: { userId },
      select: { entryPrice: true, stopLoss: true, takeProfit: true },
    }),
    prisma.journalEntry.findFirst({
      where: { userId, result: 'WIN' },
      orderBy: { pnl: 'desc' },
      include: { fundedAccount: { select: { accountSize: true, currency: true } } },
    }),
    prisma.journalEntry.findFirst({
      where: { userId, result: 'LOSS' },
      orderBy: { pnl: 'asc' },
      include: { fundedAccount: { select: { accountSize: true, currency: true } } },
    }),
  ])

  const winrate = total > 0 ? Math.round((wins / total) * 100) : 0
  const totalPages = Math.ceil(total / limit)
  const parsed = entries.map((e) => ({ ...e, images: JSON.parse(e.images || '[]') }))

  const calendarEntries = allEntries.map((e) => ({
    ...e,
    tradeDate: e.tradeDate.toISOString(),
  }))

  // Avg % (all trades)
  const avgWinPct = winTrades.length > 0 ? winTrades.reduce((s, e) => s + e.pnl, 0) / winTrades.length : 0
  const avgLossPct = lossTrades.length > 0 ? lossTrades.reduce((s, e) => s + e.pnl, 0) / lossTrades.length : 0

  // Avg $ (only trades linked to a funded account)
  const winDollarValues = winTrades
    .filter(e => e.fundedAccount)
    .map(e => (e.pnl / 100) * e.fundedAccount.accountSize)
  const avgWinDollar = winDollarValues.length > 0
    ? winDollarValues.reduce((s, v) => s + v, 0) / winDollarValues.length
    : null

  const lossDollarValues = lossTrades
    .filter(e => e.fundedAccount)
    .map(e => (e.pnl / 100) * e.fundedAccount.accountSize)
  const avgLossDollar = lossDollarValues.length > 0
    ? lossDollarValues.reduce((s, v) => s + v, 0) / lossDollarValues.length
    : null

  // Planned R:R — use absolute distances so direction errors don't filter valid trades
  const rrValues = rrEntries
    .map(e => {
      const risk = Math.abs(e.entryPrice - e.stopLoss)
      const reward = Math.abs(e.takeProfit - e.entryPrice)
      if (risk === 0 || reward === 0) return null
      return reward / risk
    })
    .filter(v => v !== null && isFinite(v) && v > 0)
  const avgRR = rrValues.length > 0 ? rrValues.reduce((s, v) => s + v, 0) / rrValues.length : 0

  const bestTradeUsd = bestTrade?.fundedAccount
    ? (bestTrade.pnl / 100) * bestTrade.fundedAccount.accountSize
    : null
  const worstTradeUsd = worstTrade?.fundedAccount
    ? (worstTrade.pnl / 100) * worstTrade.fundedAccount.accountSize
    : null

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <NotebookPen size={24} className="text-amber-400" />
          <h1 className="text-2xl font-bold text-gray-100">Trade Journal</h1>
        </div>
        <Link
          href="/journal/new"
          className="bg-amber-400 hover:bg-amber-500 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + New Trade
        </Link>
      </div>

      {/* Overview stats */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-4 flex items-center gap-8">
        <WinrateCircle winrate={winrate} size={100} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-gray-400 text-sm">Total</p>
            <p className="text-3xl font-bold text-gray-100">{total}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Wins</p>
            <p className="text-3xl font-bold text-green-400">{wins}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Losses</p>
            <p className="text-3xl font-bold text-red-400">{losses}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Breakeven</p>
            <p className="text-3xl font-bold text-gray-400">{be}</p>
          </div>
        </div>
      </div>

      {/* Performance Statistics */}
      {total > 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 mb-6">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-4">Performance Statistics</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-4 gap-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Avg Win</p>
              {wins > 0 ? (
                <>
                  <p className="text-lg font-bold text-green-400 tabular-nums">
                    {avgWinDollar != null ? `+$${avgWinDollar.toFixed(2)}` : `+${avgWinPct.toFixed(2)}%`}
                  </p>
                  {avgWinDollar != null && (
                    <p className="text-xs text-gray-600 tabular-nums">+{avgWinPct.toFixed(2)}%</p>
                  )}
                </>
              ) : <p className="text-lg font-bold text-gray-600">—</p>}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Best Trade</p>
              {wins > 0 ? (
                <>
                  <p className="text-lg font-bold text-green-300 tabular-nums">
                    {bestTradeUsd != null
                      ? `+$${bestTradeUsd.toFixed(2)}`
                      : `+${bestTrade.pnl.toFixed(2)}%`}
                  </p>
                  {bestTradeUsd != null && (
                    <p className="text-xs text-gray-600 tabular-nums">+{bestTrade.pnl.toFixed(2)}%</p>
                  )}
                </>
              ) : <p className="text-lg font-bold text-gray-600">—</p>}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Avg Loss</p>
              {losses > 0 ? (
                <>
                  <p className="text-lg font-bold text-red-400 tabular-nums">
                    {avgLossDollar != null
                      ? `${avgLossDollar < 0 ? '-' : '+'}$${Math.abs(avgLossDollar).toFixed(2)}`
                      : `${avgLossPct.toFixed(2)}%`}
                  </p>
                  {avgLossDollar != null && (
                    <p className="text-xs text-gray-600 tabular-nums">{avgLossPct.toFixed(2)}%</p>
                  )}
                </>
              ) : <p className="text-lg font-bold text-gray-600">—</p>}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Worst Trade</p>
              {losses > 0 ? (
                <>
                  <p className="text-lg font-bold text-red-300 tabular-nums">
                    {worstTradeUsd != null
                      ? `${worstTradeUsd < 0 ? '-' : '+'}$${Math.abs(worstTradeUsd).toFixed(2)}`
                      : `${worstTrade.pnl.toFixed(2)}%`}
                  </p>
                  {worstTradeUsd != null && (
                    <p className="text-xs text-gray-600 tabular-nums">{worstTrade.pnl.toFixed(2)}%</p>
                  )}
                </>
              ) : <p className="text-lg font-bold text-gray-600">—</p>}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Avg R:R</p>
              <p className={`text-lg font-bold tabular-nums ${avgRR >= 1 ? 'text-amber-400' : avgRR > 0 ? 'text-gray-300' : 'text-gray-600'}`}>
                {avgRR > 0 ? `${avgRR.toFixed(2)}R` : '—'}
              </p>
              {avgRR > 0 && (
                <p className="text-xs text-gray-600">from SL/TP</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pair statistics */}
      <PairStats entries={calendarEntries} />

      {/* Trading calendar */}
      <TradeCalendar entries={calendarEntries} />

      {/* Trade list */}
      <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">Trade History</h2>
      <div className="space-y-3">
        {parsed.map((entry) => (
          <JournalCard key={entry.id} entry={entry} />
        ))}
        {parsed.length === 0 && (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-12 text-center">
            <p className="text-gray-400">No journal entries yet.</p>
            <Link
              href="/journal/new"
              className="inline-block mt-3 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black text-sm font-semibold rounded-lg transition-colors"
            >
              Add your first trade
            </Link>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/journal?page=${p}`}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors
                ${p === page
                  ? 'bg-amber-400 text-black font-semibold'
                  : 'bg-[#1a1a1a] text-gray-400 hover:text-gray-100 border border-[#2a2a2a] hover:border-amber-400/40'
                }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
