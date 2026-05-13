import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Users, Video, NotebookPen, FolderOpen, TrendingUp, TrendingDown, Activity } from 'lucide-react'

export const metadata = { title: 'Admin Overview — NST Bootcamp' }

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
        <Icon size={16} className={color} />
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function PerfStat({ label, value, sub, color = 'text-gray-100' }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  )
}

export default async function AdminDashboard() {
  const [
    totalUsers,
    totalVideos,
    totalJournals,
    totalCategories,
    allUsers,
    resultGroups,
    winAgg,
    lossAgg,
    totalPnlAgg,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.video.count(),
    prisma.journalEntry.count(),
    prisma.category.count(),
    prisma.user.findMany({ select: { id: true, username: true, createdAt: true } }),
    prisma.journalEntry.groupBy({
      by: ['userId', 'result'],
      _count: { _all: true },
    }),
    prisma.journalEntry.aggregate({
      where: { result: 'WIN' },
      _avg: { pnl: true },
      _max: { pnl: true },
    }),
    prisma.journalEntry.aggregate({
      where: { result: 'LOSS' },
      _avg: { pnl: true },
      _min: { pnl: true },
    }),
    prisma.journalEntry.aggregate({
      _sum: { pnl: true },
    }),
  ])

  // Per-user stats
  const statsMap = {}
  let platformWins = 0
  let platformTotal = 0
  for (const row of resultGroups) {
    if (!statsMap[row.userId]) statsMap[row.userId] = { total: 0, wins: 0 }
    statsMap[row.userId].total += row._count._all
    platformTotal += row._count._all
    if (row.result === 'WIN') {
      statsMap[row.userId].wins += row._count._all
      platformWins += row._count._all
    }
  }

  const withTrades = allUsers
    .map((u) => {
      const s = statsMap[u.id] ?? { total: 0, wins: 0 }
      return {
        ...u,
        stats: {
          total: s.total,
          winrate: s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0,
        },
      }
    })
    .filter((u) => u.stats.total > 0)

  const sorted = [...withTrades].sort((a, b) => b.stats.winrate - a.stats.winrate)
  const top5 = sorted.slice(0, 5)
  const top5Ids = new Set(top5.map((u) => u.id))
  const bottom5 = sorted.filter((u) => !top5Ids.has(u.id)).reverse().slice(0, 5)

  // Platform performance metrics
  const platformWinrate = platformTotal > 0 ? Math.round((platformWins / platformTotal) * 100) : 0
  const avgWin = winAgg._avg.pnl ?? 0
  const maxWin = winAgg._max.pnl ?? 0
  const avgLoss = lossAgg._avg.pnl ?? 0
  const maxLoss = lossAgg._min.pnl ?? 0
  const platformRR = avgLoss !== 0 ? (avgWin / Math.abs(avgLoss)) : 0
  const platformNetPnl = totalPnlAgg._sum.pnl ?? 0

  const usersWithTrades = withTrades.length
  const activeRate = allUsers.length > 0 ? Math.round((usersWithTrades / allUsers.length) * 100) : 0

  return (
    <div>
      {/* Platform overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users" value={totalUsers} icon={Users} color="text-blue-400" />
        <StatCard label="Total Videos" value={totalVideos} icon={Video} color="text-purple-400" />
        <StatCard label="Journal Entries" value={totalJournals} icon={NotebookPen} color="text-green-400" />
        <StatCard label="Categories" value={totalCategories} icon={FolderOpen} color="text-amber-400" />
      </div>

      {/* Platform performance stats */}
      {totalJournals > 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={14} className="text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Platform Performance</span>
            <span className="ml-auto text-xs text-gray-600">{usersWithTrades} of {allUsers.length} users trading · {activeRate}% active</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-6 gap-y-4">
            <PerfStat
              label="Avg Winrate"
              value={`${platformWinrate}%`}
              sub={`${platformWins}W / ${platformTotal - platformWins}L`}
              color={platformWinrate >= 50 ? 'text-green-400' : 'text-red-400'}
            />
            <PerfStat
              label="Avg Win"
              value={`+${avgWin.toFixed(2)}%`}
              color="text-green-400"
            />
            <PerfStat
              label="Max Win"
              value={`+${maxWin.toFixed(2)}%`}
              color="text-green-300"
            />
            <PerfStat
              label="Avg Loss"
              value={`${avgLoss.toFixed(2)}%`}
              color="text-red-400"
            />
            <PerfStat
              label="Max Loss"
              value={`${maxLoss.toFixed(2)}%`}
              color="text-red-300"
            />
            <PerfStat
              label="Avg R:R"
              value={platformRR > 0 ? `${platformRR.toFixed(2)}R` : '—'}
              color={platformRR >= 1 ? 'text-amber-400' : 'text-gray-400'}
            />
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {withTrades.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={15} className="text-green-400" />
              <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Top Performers</span>
            </div>
            <div className="space-y-2.5">
              {top5.map((u, i) => (
                <Link
                  key={u.id}
                  href={`/admin/users/${u.id}`}
                  className="flex items-center gap-3 py-1 group"
                >
                  <span className="text-xs text-gray-600 w-4 shrink-0 font-mono">{i + 1}</span>
                  <span className="text-sm text-gray-200 w-24 truncate group-hover:text-amber-400 transition-colors">{u.username}</span>
                  <div className="flex-1 bg-[#0f0f0f] rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${u.stats.winrate}%` }} />
                  </div>
                  <span className="text-xs font-bold text-green-400 w-10 text-right tabular-nums">{u.stats.winrate}%</span>
                  <span className="text-xs text-gray-600 w-16 text-right">{u.stats.total} trades</span>
                </Link>
              ))}
            </div>
          </div>

          {bottom5.length > 0 ? (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown size={15} className="text-red-400" />
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Needs Attention</span>
              </div>
              <div className="space-y-2.5">
                {bottom5.map((u, i) => (
                  <Link
                    key={u.id}
                    href={`/admin/users/${u.id}`}
                    className="flex items-center gap-3 py-1 group"
                  >
                    <span className="text-xs text-gray-600 w-4 shrink-0 font-mono">{i + 1}</span>
                    <span className="text-sm text-gray-200 w-24 truncate group-hover:text-amber-400 transition-colors">{u.username}</span>
                    <div className="flex-1 bg-[#0f0f0f] rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${u.stats.winrate}%` }} />
                    </div>
                    <span className="text-xs font-bold text-red-400 w-10 text-right tabular-nums">{u.stats.winrate}%</span>
                    <span className="text-xs text-gray-600 w-16 text-right">{u.stats.total} trades</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 flex items-center justify-center">
              <p className="text-sm text-gray-500">All active users are performing well.</p>
            </div>
          )}
        </div>
      )}

      {withTrades.length === 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-10 text-center">
          <p className="text-gray-500 text-sm">No trading data yet. Leaderboard will appear once users start journaling.</p>
        </div>
      )}
    </div>
  )
}
