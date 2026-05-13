'use client'

import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'

const DEFAULT_PAIRS = ['XAUUSD', 'EURUSD', 'NAS100', 'GBPUSD', 'USDJPY', 'US30']

export default function PairSelector({ value, onChange, userId }) {
  const storageKey = `nst-pairs-${userId ?? 'default'}`
  const [customPairs, setCustomPairs] = useState([])
  const [adding, setAdding] = useState(false)
  const [newPair, setNewPair] = useState('')

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '[]')
      setCustomPairs(stored)
    } catch {}
  }, [storageKey])

  function saveCustom(pairs) {
    setCustomPairs(pairs)
    localStorage.setItem(storageKey, JSON.stringify(pairs))
  }

  function confirmAdd() {
    const p = newPair.trim().toUpperCase()
    if (p && !DEFAULT_PAIRS.includes(p) && !customPairs.includes(p)) {
      saveCustom([...customPairs, p])
      onChange(p)
    }
    setAdding(false)
    setNewPair('')
  }

  function removePair(pair) {
    saveCustom(customPairs.filter((p) => p !== pair))
    if (value === pair) onChange('')
  }

  const btnClass = (active) =>
    `px-3 py-1 rounded-lg text-sm transition-colors border ${
      active
        ? 'bg-amber-400 text-black border-amber-400 font-semibold'
        : 'border-[#2a2a2a] text-gray-400 hover:border-amber-400/40 hover:text-gray-200'
    }`

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">Pair</label>
      <div className="flex gap-2 flex-wrap mb-2 items-center">
        {DEFAULT_PAIRS.map((p) => (
          <button key={p} type="button" onClick={() => onChange(p)} className={btnClass(value === p)}>
            {p}
          </button>
        ))}

        {customPairs.map((p) => (
          <div key={p} className="flex">
            <button
              type="button"
              onClick={() => onChange(p)}
              className={`px-3 py-1 rounded-l-lg text-sm transition-colors border border-r-0 ${
                value === p
                  ? 'bg-amber-400 text-black border-amber-400 font-semibold'
                  : 'border-[#2a2a2a] text-gray-400 hover:border-amber-400/40 hover:text-gray-200'
              }`}
            >
              {p}
            </button>
            <button
              type="button"
              onClick={() => removePair(p)}
              className="px-1.5 py-1 rounded-r-lg border border-l-0 border-[#2a2a2a] text-gray-600 hover:text-red-400 hover:border-red-400/40 transition-colors"
              title="Remove pair"
            >
              <X size={10} />
            </button>
          </div>
        ))}

        {adding ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              type="text"
              value={newPair}
              onChange={(e) => setNewPair(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); confirmAdd() }
                if (e.key === 'Escape') { setAdding(false); setNewPair('') }
              }}
              placeholder="e.g. BTCUSD"
              maxLength={10}
              className="w-24 bg-[#0f0f0f] border border-amber-400/50 rounded-lg px-2 py-1 text-gray-100 text-xs focus:outline-none focus:border-amber-400"
            />
            <button
              type="button"
              onClick={confirmAdd}
              className="px-2 py-1 bg-amber-400 hover:bg-amber-500 text-black text-xs rounded-lg font-semibold transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setNewPair('') }}
              className="px-2 py-1 border border-[#2a2a2a] text-gray-400 hover:text-gray-100 text-xs rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 px-2 py-1 border border-dashed border-[#2a2a2a] text-gray-600 hover:text-amber-400 hover:border-amber-400/40 rounded-lg text-xs transition-colors"
          >
            <Plus size={11} />
            Add pair
          </button>
        )}
      </div>

      <input
        name="pair"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        required
        placeholder="Or type a pair..."
        className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-amber-400 transition-colors"
      />
    </div>
  )
}
