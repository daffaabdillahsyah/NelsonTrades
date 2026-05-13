import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, TrendingUp, TrendingDown, Minus, Pencil } from 'lucide-react'
import Image from 'next/image'
import DeleteJournalButton from '@/components/DeleteJournalButton'

const resultConfig = {
  WIN: { label: 'WIN', color: 'text-green-400', bg: 'bg-green-400/10', Icon: TrendingUp },
  LOSS: { label: 'LOSS', color: 'text-red-400', bg: 'bg-red-400/10', Icon: TrendingDown },
  BE: { label: 'BE', color: 'text-gray-400', bg: 'bg-gray-400/10', Icon: Minus },
}

export default async function JournalEntryPage({ params }) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  const entry = await prisma.journalEntry.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!entry) notFound()

  const images = JSON.parse(entry.images || '[]')
  const cfg = resultConfig[entry.result] ?? resultConfig.BE
  const date = new Date(entry.tradeDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/journal"
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-amber-400 transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Journal
        </Link>
        <div className="flex items-center gap-2">
          <DeleteJournalButton id={id} />
          <Link
            href={`/journal/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-amber-400/40 text-gray-300 hover:text-amber-400 rounded-lg text-sm transition-colors"
          >
            <Pencil size={14} />
            Edit
          </Link>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">{entry.pair}</h1>
            <p className="text-sm text-gray-400 mt-1">{date}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${cfg.color} ${cfg.bg}`}>
              {cfg.label}
            </span>
            <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border
              ${entry.direction === 'BUY'
                ? 'text-green-400 bg-green-400/10 border-green-400/20'
                : 'text-red-400 bg-red-400/10 border-red-400/20'
              }`}>
              {entry.direction}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Entry Price', value: entry.entryPrice },
            { label: 'Exit Price', value: entry.exitPrice },
            { label: 'Stop Loss', value: entry.stopLoss },
            { label: 'Take Profit', value: entry.takeProfit },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#0f0f0f] rounded-lg p-3">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-sm font-semibold text-gray-200 mt-1">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-[#2a2a2a] flex items-center gap-2">
          <p className="text-sm text-gray-400">PnL:</p>
          <p className={`text-xl font-bold ${entry.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {entry.pnl >= 0 ? '+' : ''}{entry.pnl}%
          </p>
        </div>
      </div>

      {entry.notes && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-4">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">Notes</h2>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{entry.notes}</p>
        </div>
      )}

      {images.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">
            Screenshots ({images.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {images.map((url, i) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="group block">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                  <Image
                    src={url}
                    alt={`Trade screenshot ${i + 1}`}
                    fill
                    className="object-cover transition-opacity group-hover:opacity-90"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
