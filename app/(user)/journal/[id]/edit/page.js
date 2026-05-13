'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ChevronLeft, Upload, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import PairSelector from '@/components/PairSelector'

function InputField({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-amber-400 transition-colors"
      />
    </div>
  )
}

export default function EditJournalPage() {
  const router = useRouter()
  const { id } = useParams()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [error, setError] = useState('')
  const [images, setImages] = useState([])
  const [accounts, setAccounts] = useState([])
  const [pnlDollar, setPnlDollar] = useState('')
  const [form, setForm] = useState({
    pair: '',
    direction: 'BUY',
    entryPrice: '',
    exitPrice: '',
    stopLoss: '',
    takeProfit: '',
    result: 'WIN',
    pnl: '',
    notes: '',
    tradeDate: '',
    fundedAccountId: '',
  })

  useEffect(() => {
    fetch('/api/accounts').then((r) => r.json()).then(setAccounts).catch(() => {})
  }, [])

  useEffect(() => {
    fetch(`/api/journal/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          pair: data.pair,
          direction: data.direction,
          entryPrice: data.entryPrice,
          exitPrice: data.exitPrice,
          stopLoss: data.stopLoss,
          takeProfit: data.takeProfit,
          result: data.result,
          pnl: data.pnl,
          notes: data.notes,
          tradeDate: new Date(data.tradeDate).toISOString().split('T')[0],
          fundedAccountId: data.fundedAccountId ?? '',
        })
        setImages(data.images || [])
        setFetching(false)
      })
      .catch(() => setFetching(false))
  }, [id])

  // Back-compute dollar from pnl% when both entry and accounts are loaded (runs once)
  useEffect(() => {
    if (pnlDollar !== '' || !form.fundedAccountId || accounts.length === 0 || form.pnl === '') return
    const acc = accounts.find(a => a.id === form.fundedAccountId)
    if (acc) {
      setPnlDollar(((parseFloat(form.pnl) / 100) * acc.accountSize).toFixed(2))
    }
  }, [form.fundedAccountId, accounts, form.pnl, pnlDollar])

  const selectedAccount = accounts.find(a => a.id === form.fundedAccountId) || null

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => {
      const updated = { ...f, [name]: value }
      if (name === 'fundedAccountId') {
        if (value === '') {
          setPnlDollar('')
        } else if (pnlDollar !== '') {
          const acc = accounts.find(a => a.id === value)
          if (acc) {
            updated.pnl = ((parseFloat(pnlDollar) || 0) / acc.accountSize * 100).toFixed(4)
          }
        }
      }
      return updated
    })
  }

  function handlePnlDollarChange(e) {
    const val = e.target.value
    setPnlDollar(val)
    if (selectedAccount && val !== '') {
      const pct = ((parseFloat(val) || 0) / selectedAccount.accountSize) * 100
      setForm(f => ({ ...f, pnl: pct.toFixed(4) }))
    }
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploadingImages(true)
    const data = new FormData()
    files.forEach((f) => data.append('files', f))
    const res = await fetch('/api/upload', { method: 'POST', body: data })
    const json = await res.json()
    setImages((prev) => [...prev, ...json.urls])
    setUploadingImages(false)
  }

  function removeImage(url) {
    setImages((prev) => prev.filter((u) => u !== url))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch(`/api/journal/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, images }),
    })

    if (res.ok) {
      router.push(`/journal/${id}`)
    } else {
      setError('Failed to update entry. Please try again.')
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/journal/${id}`}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-amber-400 transition-colors mb-6"
      >
        <ChevronLeft size={16} />
        Back to Entry
      </Link>

      <h1 className="text-2xl font-bold text-gray-100 mb-6">Edit Trade Entry</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-amber-400">Trade Details</h2>

          <PairSelector
            value={form.pair}
            onChange={(p) => setForm((f) => ({ ...f, pair: p }))}
            userId={session?.user?.id}
          />

          {accounts.length > 0 && (
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Funded Account <span className="text-gray-600">(optional)</span></label>
              <select
                name="fundedAccountId"
                value={form.fundedAccountId}
                onChange={handleChange}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-amber-400 transition-colors"
              >
                <option value="">— No account —</option>
                {accounts.filter(a => a.status === 'ACTIVE' || a.id === form.fundedAccountId).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}{a.broker ? ` · ${a.broker}` : ''} (${a.accountSize.toLocaleString()})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Direction</label>
            <div className="flex rounded-lg overflow-hidden border border-[#2a2a2a] w-fit">
              {['BUY', 'SELL'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, direction: d }))}
                  className={`px-8 py-2 text-sm font-semibold transition-colors
                    ${form.direction === d
                      ? d === 'BUY' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                    }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField label="Entry Price" name="entryPrice" type="number" step="any" required value={form.entryPrice} onChange={handleChange} />
            <InputField label="Exit Price" name="exitPrice" type="number" step="any" required value={form.exitPrice} onChange={handleChange} />
            <InputField label="Stop Loss" name="stopLoss" type="number" step="any" required value={form.stopLoss} onChange={handleChange} />
            <InputField label="Take Profit" name="takeProfit" type="number" step="any" required value={form.takeProfit} onChange={handleChange} />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Result</label>
            <div className="flex gap-3">
              {[
                { value: 'WIN', color: 'bg-green-500' },
                { value: 'LOSS', color: 'bg-red-500' },
                { value: 'BE', color: 'bg-gray-500' },
              ].map(({ value, color }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="result" value={value} checked={form.result === value} onChange={handleChange} className="sr-only" />
                  <span className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-opacity border-2
                    ${form.result === value ? `${color} text-white border-transparent` : 'border-[#2a2a2a] text-gray-400'}`}>
                    {value}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {selectedAccount ? (
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                P&L <span className="text-gray-600">({selectedAccount.currency})</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={pnlDollar}
                onChange={handlePnlDollarChange}
                placeholder="e.g. 500.00"
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-amber-400 transition-colors"
              />
              {pnlDollar !== '' && form.pnl !== '' && (
                <p className="text-xs text-gray-500 mt-1.5 tabular-nums">
                  = {parseFloat(form.pnl) >= 0 ? '+' : ''}{parseFloat(form.pnl).toFixed(2)}% of {selectedAccount.currency} {selectedAccount.accountSize.toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">P&L (%)</label>
              <input
                type="number"
                step="any"
                required
                name="pnl"
                value={form.pnl}
                onChange={handleChange}
                placeholder="e.g. 2.5"
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-amber-400 transition-colors"
              />
              <p className="text-xs text-gray-600 mt-1.5">Select a funded account above to enter dollar amount instead</p>
            </div>
          )}
          <InputField label="Trade Date" name="tradeDate" type="date" required value={form.tradeDate} onChange={handleChange} />
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-amber-400">Notes & Images</h2>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Images</label>
            <label className="flex items-center gap-3 px-4 py-3 border border-dashed border-[#2a2a2a] rounded-lg cursor-pointer hover:border-amber-400/40 transition-colors w-fit">
              <Upload size={18} className="text-gray-400" />
              <span className="text-sm text-gray-400">{uploadingImages ? 'Uploading...' : 'Add more screenshots'}</span>
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="sr-only" disabled={uploadingImages} />
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {images.map((url) => (
                  <div key={url} className="relative aspect-video rounded-lg overflow-hidden group">
                    <Image
                      src={url}
                      alt="Trade screenshot"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 33vw, 200px"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3">
          <Link href={`/journal/${id}`} className="px-6 py-2.5 border border-[#2a2a2a] text-gray-400 hover:text-gray-100 rounded-lg text-sm transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || uploadingImages}
            className="flex-1 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-black font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Saving...' : 'Update Trade'}
          </button>
        </div>
      </form>
    </div>
  )
}
