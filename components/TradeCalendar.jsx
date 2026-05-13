'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function TradeCalendar({ entries }) {
  const today = new Date()
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selectedDay, setSelectedDay] = useState(null)

  // Close modal on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setSelectedDay(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const dayMap = useMemo(() => {
    const map = {}
    for (const e of entries) {
      const d = new Date(e.tradeDate)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!map[key]) map[key] = []
      map[key].push(e)
    }
    return map
  }, [entries])

  function prevMonth() {
    setCurrent((c) => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 })
    setSelectedDay(null)
  }
  function nextMonth() {
    setCurrent((c) => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 })
    setSelectedDay(null)
  }

  const { year, month } = current
  const monthLabel = new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const selectedKey = selectedDay != null ? `${year}-${month}-${selectedDay}` : null
  const selectedEntries = selectedKey ? (dayMap[selectedKey] || []) : []
  const selectedDateLabel = selectedDay != null
    ? new Date(year, month, selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : ''

  return (
    <>
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 mb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Trading Calendar</h2>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-1.5 text-gray-500 hover:text-gray-200 transition-colors rounded-lg hover:bg-[#2a2a2a]">
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm text-gray-200 w-36 text-center">{monthLabel}</span>
            <button onClick={nextMonth} className="p-1.5 text-gray-500 hover:text-gray-200 transition-colors rounded-lg hover:bg-[#2a2a2a]">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs text-gray-600 py-1">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} />
            const key = `${year}-${month}-${day}`
            const dayEntries = dayMap[key] || []
            const hasEntries = dayEntries.length > 0
            const netPnl = dayEntries.reduce((s, e) => s + e.pnl, 0)
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
            const isSelected = selectedDay === day

            let bg = 'bg-[#0f0f0f] hover:bg-[#1f1f1f]'
            let text = 'text-gray-500'
            let pnlText = ''
            if (hasEntries) {
              if (netPnl > 0) { bg = 'bg-green-500/15 hover:bg-green-500/25'; text = 'text-green-400'; pnlText = `+${netPnl.toFixed(1)}%` }
              else if (netPnl < 0) { bg = 'bg-red-500/15 hover:bg-red-500/25'; text = 'text-red-400'; pnlText = `${netPnl.toFixed(1)}%` }
              else { bg = 'bg-gray-500/15 hover:bg-gray-500/25'; text = 'text-gray-300'; pnlText = '0%' }
            }

            return (
              <button
                key={day}
                type="button"
                onClick={() => hasEntries && setSelectedDay(isSelected ? null : day)}
                className={`rounded-lg p-1.5 flex flex-col items-center justify-center gap-0.5 transition-colors ${bg} ${isSelected ? 'ring-2 ring-amber-400' : ''} ${hasEntries ? 'cursor-pointer' : 'cursor-default'}`}
                style={{ minHeight: '3rem' }}
              >
                <span className={`text-xs font-medium leading-none ${isToday ? 'text-amber-400 font-bold' : text}`}>{day}</span>
                <span className={`text-[9px] font-semibold leading-none ${pnlText ? text : 'opacity-0 select-none'}`}>
                  {pnlText || '+0.0%'}
                </span>
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#2a2a2a]">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-500/40" /><span className="text-xs text-gray-500">Profit</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500/40" /><span className="text-xs text-gray-500">Loss</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-gray-500/30" /><span className="text-xs text-gray-500">Breakeven</span></div>
          <span className="text-xs text-gray-600 ml-auto">Click a day to view trades</span>
        </div>
      </div>

      {/* Modal overlay */}
      {selectedDay != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedDay(null)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#2a2a2a]">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Trade Summary</p>
                <h3 className="font-semibold text-gray-100">{selectedDateLabel}</h3>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1.5 text-gray-500 hover:text-gray-200 transition-colors rounded-lg hover:bg-[#2a2a2a]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {selectedEntries.map((e) => {
                const rc = e.result === 'WIN'
                  ? 'text-green-400 bg-green-400/10'
                  : e.result === 'LOSS'
                    ? 'text-red-400 bg-red-400/10'
                    : 'text-gray-400 bg-gray-400/10'
                return (
                  <Link
                    key={e.id}
                    href={`/journal/${e.id}`}
                    onClick={() => setSelectedDay(null)}
                    className="flex items-center justify-between bg-[#0f0f0f] rounded-xl px-4 py-3 hover:bg-[#242424] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${rc}`}>{e.result}</span>
                      <span className="text-sm font-semibold text-gray-200">{e.pair}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        e.direction === 'BUY' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                      }`}>{e.direction}</span>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${e.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {e.pnl >= 0 ? '+' : ''}{e.pnl}%
                    </span>
                  </Link>
                )
              })}
            </div>

            {/* Modal footer — day summary */}
            {selectedEntries.length > 1 && (() => {
              const dayPnl = selectedEntries.reduce((s, e) => s + e.pnl, 0)
              const wins = selectedEntries.filter(e => e.result === 'WIN').length
              return (
                <div className="px-5 py-4 border-t border-[#2a2a2a] flex items-center justify-between">
                  <span className="text-xs text-gray-500">{selectedEntries.length} trades · {wins}W / {selectedEntries.length - wins}L</span>
                  <span className={`text-sm font-bold tabular-nums ${dayPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    Net {dayPnl >= 0 ? '+' : ''}{dayPnl.toFixed(2)}%
                  </span>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </>
  )
}
