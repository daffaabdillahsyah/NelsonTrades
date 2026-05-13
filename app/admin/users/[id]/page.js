'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import WinrateCircle from '@/components/WinrateCircle'

const resultConfig = {
  WIN: { color: 'text-green-400', bg: 'bg-green-400/10' },
  LOSS: { color: 'text-red-400', bg: 'bg-red-400/10' },
  BE: { color: 'text-gray-400', bg: 'bg-gray-400/10' },
}

export default function AdminUserProgressPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
  }, [id])

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
      </div>
    )
  }

  const { user, stats, entries } = data

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-amber-400 transition-colors mb-4"
        >
          <ChevronLeft size={16} />
          Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-gray-100">@{user.username}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {user.role} · Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-6">
        <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-5">Trading Stats</h2>
        <div className="flex items-center gap-8">
          <WinrateCircle winrate={stats.winrate} size={100} />
          <div className="grid grid-cols-3 gap-x-8 gap-y-4">
            <div>
              <p className="text-gray-500 text-xs">Total Trades</p>
              <p className="text-2xl font-bold text-gray-100 mt-0.5">{stats.total}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Wins</p>
              <p className="text-2xl font-bold text-green-400 mt-0.5">{stats.wins}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Losses</p>
              <p className="text-2xl font-bold text-red-400 mt-0.5">{stats.losses}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Breakeven</p>
              <p className="text-2xl font-bold text-gray-400 mt-0.5">{stats.be}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Total PnL</p>
              <p className={`text-2xl font-bold mt-0.5 ${stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl}%
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Win Rate</p>
              <p className="text-2xl font-bold text-amber-400 mt-0.5">{stats.winrate}%</p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
        Recent Trades ({entries.length})
      </h2>

      <div className="space-y-2">
        {entries.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-10 text-center">
            <p className="text-gray-400 text-sm">No trades recorded yet.</p>
          </div>
        ) : (
          entries.map((entry) => {
            const cfg = resultConfig[entry.result] ?? resultConfig.BE
            return (
              <div key={entry.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-100">{entry.pair}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {entry.direction} · {new Date(entry.tradeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
                      {entry.result}
                    </span>
                    <span className={`text-sm font-semibold tabular-nums ${entry.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.pnl >= 0 ? '+' : ''}{entry.pnl}%
                    </span>
                  </div>
                </div>
                {entry.notes ? (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-1">{entry.notes}</p>
                ) : null}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
