import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const resultConfig = {
  WIN: { label: 'WIN', color: 'text-green-400', bg: 'bg-green-400/10', Icon: TrendingUp },
  LOSS: { label: 'LOSS', color: 'text-red-400', bg: 'bg-red-400/10', Icon: TrendingDown },
  BE: { label: 'BE', color: 'text-gray-400', bg: 'bg-gray-400/10', Icon: Minus },
}

export default function JournalCard({ entry }) {
  const cfg = resultConfig[entry.result] ?? resultConfig.BE
  const date = new Date(entry.tradeDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Link href={`/journal/${entry.id}`}>
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 hover:border-amber-400/40 transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-gray-100">{entry.pair}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {entry.direction} · {date}
            </p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
            {cfg.label}
          </span>
        </div>
        <div className="flex gap-6 mt-3">
          <div>
            <p className="text-xs text-gray-500">Entry</p>
            <p className="text-sm text-gray-200">{entry.entryPrice}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Exit</p>
            <p className="text-sm text-gray-200">{entry.exitPrice}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">PnL</p>
            <p className={`text-sm font-medium ${entry.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {entry.pnl >= 0 ? '+' : ''}{entry.pnl}%
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}
