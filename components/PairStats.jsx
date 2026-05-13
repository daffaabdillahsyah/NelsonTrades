'use client'

import { useMemo } from 'react'

export default function PairStats({ entries }) {
  const stats = useMemo(() => {
    const map = {}
    for (const e of entries) {
      if (!map[e.pair]) map[e.pair] = { pair: e.pair, total: 0, wins: 0, losses: 0, be: 0, totalPnl: 0 }
      const s = map[e.pair]
      s.total++
      s.totalPnl += e.pnl
      if (e.result === 'WIN') s.wins++
      else if (e.result === 'LOSS') s.losses++
      else s.be++
    }
    return Object.values(map)
      .map((s) => ({
        ...s,
        winrate: Math.round((s.wins / s.total) * 100),
        totalPnl: parseFloat(s.totalPnl.toFixed(2)),
      }))
      .sort((a, b) => b.total - a.total)
  }, [entries])

  if (stats.length === 0) return null

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">Pair Statistics</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.pair} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-100 text-sm">{s.pair}</span>
              <span className={`text-xl font-bold tabular-nums ${s.winrate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                {s.winrate}%
              </span>
            </div>

            <div className="w-full bg-[#0f0f0f] rounded-full h-1.5 mb-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${s.winrate >= 50 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${s.winrate}%` }}
              />
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{s.total} trades</span>
              <div className="flex gap-2">
                <span className="text-green-400">{s.wins}W</span>
                <span className="text-red-400">{s.losses}L</span>
                {s.be > 0 && <span className="text-gray-500">{s.be}BE</span>}
              </div>
              <span className={`font-medium tabular-nums ${s.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {s.totalPnl >= 0 ? '+' : ''}{s.totalPnl}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
