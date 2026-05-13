import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import WinrateCircle from '@/components/WinrateCircle'
import JournalCard from '@/components/JournalCard'
import Link from 'next/link'
import { Wallet, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

export const metadata = { title: 'Dashboard — NST Bootcamp' }

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = session.user.id

  const today = new Date()
  const dateLabel = today.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const [recentEntries, total, wins, losses, be, winTrades, lossTrades, netAgg, activeAccounts, rrEntries, bestTrade, worstTrade] =
    await Promise.all([
      prisma.journalEntry.findMany({
        where: { userId },
        orderBy: { tradeDate: 'desc' },
        take: 3,
      }),
      prisma.journalEntry.count({ where: { userId } }),
      prisma.journalEntry.count({ where: { userId, result: 'WIN' } }),
      prisma.journalEntry.count({ where: { userId, result: 'LOSS' } }),
      prisma.journalEntry.count({ where: { userId, result: 'BE' } }),
      prisma.journalEntry.findMany({
        where: { userId, result: 'WIN' },
        select: { pnl: true, fundedAccount: { select: { accountSize: true, currency: true } } },
      }),
      prisma.journalEntry.findMany({
        where: { userId, result: 'LOSS' },
        select: { pnl: true, fundedAccount: { select: { accountSize: true, currency: true } } },
      }),
      prisma.journalEntry.aggregate({
        where: { userId },
        _sum: { pnl: true },
      }),
      prisma.fundedAccount.findMany({
        where: { userId },
        include: { journals: { select: { pnl: true, tradeDate: true } } },
        orderBy: { createdAt: 'desc' },
        take: 3,
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
  const parsed = recentEntries.map((e) => ({ ...e, images: JSON.parse(e.images || '[]') }))

  const netPnl = netAgg._sum.pnl ?? 0

  const avgWinPct = winTrades.length > 0 ? winTrades.reduce((s, e) => s + e.pnl, 0) / winTrades.length : 0
  const avgLossPct = lossTrades.length > 0 ? lossTrades.reduce((s, e) => s + e.pnl, 0) / lossTrades.length : 0

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

  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)
  const todayEnd = new Date(todayStart)
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1)

  const accountsWithPnl = activeAccounts.map((acc) => {
    const totalPnlPct = acc.journals.reduce((s, j) => s + j.pnl, 0)
    const totalPnlDollar = (totalPnlPct / 100) * acc.accountSize

    const todayJournals = acc.journals.filter((j) => {
      const d = new Date(j.tradeDate)
      return d >= todayStart && d < todayEnd
    })
    const dailyPnlPct = todayJournals.reduce((s, j) => s + j.pnl, 0)
    const dailyPnlDollar = (dailyPnlPct / 100) * acc.accountSize

    const ddPct = totalPnlDollar < 0
      ? Math.abs(totalPnlDollar) / (acc.accountSize * acc.maxDrawdownPct / 100) * 100
      : 0

    const hasDailyDD = acc.dailyDrawdownPct != null && acc.dailyDrawdownPct > 0
    const dailyDdLimit = hasDailyDD ? acc.accountSize * acc.dailyDrawdownPct / 100 : 0
    const dailyLossDollar = Math.max(0, -dailyPnlDollar)
    const dailyDdUsedPct = hasDailyDD && dailyDdLimit > 0 ? (dailyLossDollar / dailyDdLimit) * 100 : 0
    const dailyLimitBreached = hasDailyDD && dailyLossDollar >= dailyDdLimit

    return {
      ...acc, totalPnlPct, totalPnlDollar, ddPct,
      dailyPnlPct, hasDailyDD, dailyDdUsedPct, dailyLimitBreached,
    }
  })

  const STATUS_BADGE = {
    ACTIVE: 'text-amber-400 bg-amber-400/10',
    PASSED: 'text-green-400 bg-green-400/10',
    BLOWN: 'text-red-400 bg-red-400/10',
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100">
          Welcome back, <span className="text-amber-400">@{session.user.username}</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">{dateLabel}</p>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 flex flex-col items-center justify-center">
          <WinrateCircle winrate={winrate} size={72} />
          <p className="text-xs text-gray-500 mt-2 text-center">Winrate</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Trades</p>
          <p className="text-3xl font-bold text-gray-100">{total}</p>
          <p className="text-xs text-gray-600 mt-1">
            <span className="text-green-400">{wins}W</span>
            {' · '}
            <span className="text-red-400">{losses}L</span>
            {be > 0 && <span className="text-gray-500">{' · '}{be}BE</span>}
          </p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Avg R:R</p>
          <p className={`text-3xl font-bold ${avgRR >= 1 ? 'text-amber-400' : avgRR > 0 ? 'text-gray-300' : 'text-gray-600'}`}>
            {avgRR > 0 ? `${avgRR.toFixed(2)}R` : '—'}
          </p>
          <p className="text-xs text-gray-600 mt-1">from SL/TP</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Net P&L</p>
          <p className={`text-3xl font-bold tabular-nums ${netPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {netPnl >= 0 ? '+' : ''}{netPnl.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-600 mt-1">All-time cumulative</p>
        </div>
      </div>

      {/* Trading Edge card */}
      {total > 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 mb-6">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-4">Trading Edge</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Avg Win</p>
              {wins > 0 ? (
                <>
                  <p className="text-xl font-bold text-green-400 tabular-nums">
                    {avgWinDollar != null ? `+$${avgWinDollar.toFixed(2)}` : `+${avgWinPct.toFixed(2)}%`}
                  </p>
                  {avgWinDollar != null && (
                    <p className="text-xs text-gray-600 tabular-nums">+{avgWinPct.toFixed(2)}%</p>
                  )}
                </>
              ) : <p className="text-xl font-bold text-gray-600">—</p>}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Best Trade</p>
              {wins > 0 ? (
                <>
                  <p className="text-xl font-bold text-green-300 tabular-nums">
                    {bestTradeUsd != null
                      ? `+$${bestTradeUsd.toFixed(2)}`
                      : `+${bestTrade.pnl.toFixed(2)}%`}
                  </p>
                  {bestTradeUsd != null && (
                    <p className="text-xs text-gray-600 tabular-nums">+{bestTrade.pnl.toFixed(2)}%</p>
                  )}
                </>
              ) : <p className="text-xl font-bold text-gray-600">—</p>}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Avg Loss</p>
              {losses > 0 ? (
                <>
                  <p className="text-xl font-bold text-red-400 tabular-nums">
                    {avgLossDollar != null
                      ? `${avgLossDollar < 0 ? '-' : '+'}$${Math.abs(avgLossDollar).toFixed(2)}`
                      : `${avgLossPct.toFixed(2)}%`}
                  </p>
                  {avgLossDollar != null && (
                    <p className="text-xs text-gray-600 tabular-nums">{avgLossPct.toFixed(2)}%</p>
                  )}
                </>
              ) : <p className="text-xl font-bold text-gray-600">—</p>}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Worst Trade</p>
              {losses > 0 ? (
                <>
                  <p className="text-xl font-bold text-red-300 tabular-nums">
                    {worstTradeUsd != null
                      ? `${worstTradeUsd < 0 ? '-' : '+'}$${Math.abs(worstTradeUsd).toFixed(2)}`
                      : `${worstTrade.pnl.toFixed(2)}%`}
                  </p>
                  {worstTradeUsd != null && (
                    <p className="text-xs text-gray-600 tabular-nums">{worstTrade.pnl.toFixed(2)}%</p>
                  )}
                </>
              ) : <p className="text-xl font-bold text-gray-600">—</p>}
            </div>
          </div>
        </div>
      )}

      {/* Funded accounts preview */}
      {accountsWithPnl.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet size={15} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Funded Accounts</h2>
            </div>
            <Link href="/accounts" className="text-xs text-gray-400 hover:text-amber-400 transition-colors">
              Manage →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {accountsWithPnl.map((acc) => (
              <div key={acc.id} className={`bg-[#1a1a1a] border rounded-xl p-4 transition-colors ${acc.dailyLimitBreached ? 'border-red-500/40' : 'border-[#2a2a2a]'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-100 truncate">{acc.name}</p>
                    {acc.broker && <p className="text-xs text-gray-500">{acc.broker}</p>}
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ml-2 ${STATUS_BADGE[acc.status] ?? STATUS_BADGE.ACTIVE}`}>
                    {acc.status}
                  </span>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <p className={`text-lg font-bold tabular-nums ${acc.totalPnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {acc.totalPnlPct >= 0 ? '+' : ''}{acc.totalPnlPct.toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-600">{acc.currency} {acc.accountSize.toLocaleString()}</p>
                  </div>
                  {acc.ddPct > 0 && (
                    <div className="flex items-center gap-1 text-xs">
                      <AlertTriangle size={10} className={acc.ddPct > 70 ? 'text-red-400' : 'text-gray-500'} />
                      <span className={acc.ddPct > 70 ? 'text-red-400' : 'text-gray-500'}>
                        Max DD {acc.ddPct.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
                {acc.hasDailyDD && (
                  <div className="border-t border-[#2a2a2a] pt-2 mt-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-gray-600">Daily DD · {acc.dailyDrawdownPct}% limit</span>
                      {acc.dailyLimitBreached ? (
                        <span className="text-[10px] text-red-400 font-semibold">LIMIT HIT</span>
                      ) : acc.dailyDdUsedPct === 0 ? (
                        <span className="text-[10px] text-green-500">Safe</span>
                      ) : (
                        <span className="text-[10px] text-red-400 tabular-nums">
                          {acc.dailyPnlPct.toFixed(2)}% today
                        </span>
                      )}
                    </div>
                    <div className="relative w-full bg-[#0f0f0f] rounded-full h-1.5 overflow-hidden">
                      {acc.dailyDdUsedPct === 0 ? (
                        <div className="absolute inset-0 bg-green-500/20 rounded-full" />
                      ) : (
                        <div
                          className={`h-full rounded-full transition-all ${
                            acc.dailyLimitBreached ? 'bg-red-500' :
                            acc.dailyDdUsedPct > 60 ? 'bg-orange-500' :
                            'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(100, acc.dailyDdUsedPct)}%` }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent trades */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Recent Trades</h2>
        <div className="flex items-center gap-3">
          <Link href="/journal/new" className="text-xs text-gray-400 hover:text-amber-400 transition-colors">
            + New Trade
          </Link>
          <Link href="/journal" className="text-xs text-gray-400 hover:text-amber-400 transition-colors">
            View all →
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {parsed.map((entry) => (
          <JournalCard key={entry.id} entry={entry} />
        ))}
        {parsed.length === 0 && (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-12 text-center">
            <p className="text-gray-400 text-sm">No trades yet. Start logging your first trade.</p>
            <Link
              href="/journal/new"
              className="inline-block mt-3 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black text-sm font-semibold rounded-lg transition-colors"
            >
              Add your first trade
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
