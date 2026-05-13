'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Plus, Pencil, Trash2, X, Check, Wallet,
  TrendingUp, TrendingDown, AlertTriangle, Calendar,
} from 'lucide-react'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'SGD', 'AUD']

const STATUS_CONFIG = {
  ACTIVE: { label: 'Active', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
  PASSED: { label: 'Passed', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30' },
  BLOWN:  { label: 'Blown',  color: 'text-red-400',   bg: 'bg-red-400/10',   border: 'border-red-400/30'  },
}

function ProgressBar({ pct, color }) {
  const capped = Math.min(100, Math.max(0, pct))
  return (
    <div className="w-full bg-[#0f0f0f] rounded-full h-1.5 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${capped}%` }} />
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, ...props }) {
  return (
    <input
      value={value} onChange={onChange} {...props}
      className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-gray-100 text-sm focus:outline-none focus:border-amber-400 transition-colors"
    />
  )
}

function AccountForm({ initial, onSave, onCancel, saving, error }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Account Name">
          <TextInput required value={form.name} placeholder="e.g. FTMO 10K — Main" onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Broker / Firm">
          <TextInput value={form.broker} placeholder="e.g. FTMO, MyFundedFx" onChange={(e) => set('broker', e.target.value)} />
        </Field>
        <Field label="Account Size">
          <TextInput type="number" required min="1" value={form.accountSize} placeholder="10000" onChange={(e) => set('accountSize', e.target.value)} />
        </Field>
        <Field label="Currency">
          <select value={form.currency} onChange={(e) => set('currency', e.target.value)}
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-gray-100 text-sm focus:outline-none focus:border-amber-400">
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </div>

      {/* Drawdown section */}
      <div className="border border-[#2a2a2a] rounded-lg p-3 space-y-3">
        <p className="text-xs text-gray-500 font-medium">Drawdown Rules</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Max Drawdown %">
            <TextInput type="number" required min="0.1" step="0.1" value={form.maxDrawdownPct} placeholder="10" onChange={(e) => set('maxDrawdownPct', e.target.value)} />
          </Field>
          <Field label={<>Daily Drawdown % <span className="text-gray-600">(optional)</span></>}>
            <TextInput type="number" min="0.1" step="0.1" value={form.dailyDrawdownPct} placeholder="Leave empty for no daily limit" onChange={(e) => set('dailyDrawdownPct', e.target.value)} />
          </Field>
        </div>
        {form.dailyDrawdownPct && form.maxDrawdownPct && parseFloat(form.dailyDrawdownPct) >= parseFloat(form.maxDrawdownPct) && (
          <p className="text-xs text-amber-400/80">Daily DD should be lower than Max DD</p>
        )}
      </div>

      <Field label="Profit Target %">
        <TextInput type="number" required min="0.1" step="0.1" value={form.profitTargetPct} placeholder="10" onChange={(e) => set('profitTargetPct', e.target.value)} />
      </Field>

      {initial.status !== undefined && (
        <Field label="Status">
          <select value={form.status} onChange={(e) => set('status', e.target.value)}
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-gray-100 text-sm focus:outline-none focus:border-amber-400">
            <option value="ACTIVE">Active</option>
            <option value="PASSED">Passed</option>
            <option value="BLOWN">Blown</option>
          </select>
        </Field>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2a2a2a] text-gray-400 hover:text-gray-100 rounded-lg text-xs transition-colors">
          <X size={12} /> Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-black text-xs font-semibold rounded-lg transition-colors">
          <Check size={12} /> {saving ? 'Saving...' : 'Save Account'}
        </button>
      </div>
    </form>
  )
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const emptyForm = {
    name: '', broker: '', accountSize: '', currency: 'USD',
    maxDrawdownPct: '', dailyDrawdownPct: '', profitTargetPct: '',
  }

  async function load() {
    try {
      const res = await fetch('/api/accounts')
      if (!res.ok) throw new Error('Failed')
      setAccounts(await res.json())
    } catch {
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleAdd(form) {
    setAdding(true); setAddError('')
    const res = await fetch('/api/accounts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    if (res.ok) { setShowAdd(false); load() } else setAddError('Failed to create account.')
    setAdding(false)
  }

  async function handleEdit(form) {
    setSaving(true); setEditError('')
    const res = await fetch(`/api/accounts/${editingId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    if (res.ok) { setEditingId(null); load() } else setEditError('Failed to update account.')
    setSaving(false)
  }

  async function handleDelete(id) {
    setDeleting(true)
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
    setConfirmDeleteId(null); setDeleting(false); load()
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Wallet size={24} className="text-amber-400" />
          <h1 className="text-2xl font-bold text-gray-100">Funded Accounts</h1>
        </div>
        <button
          onClick={() => { setShowAdd(!showAdd); setAddError('') }}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus size={16} /> Add Account
        </button>
      </div>

      {showAdd && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-4">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-4">New Funded Account</p>
          <AccountForm initial={emptyForm} onSave={handleAdd} onCancel={() => setShowAdd(false)} saving={adding} error={addError} />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-12 text-center">
          <Wallet size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No funded accounts yet.</p>
          <button onClick={() => setShowAdd(true)}
            className="inline-block mt-3 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black text-sm font-semibold rounded-lg transition-colors">
            Add your first account
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((acc) => {
            const st = STATUS_CONFIG[acc.status] ?? STATUS_CONFIG.ACTIVE
            const pnlDollar = acc.stats.totalPnlDollar
            const pnlPct = acc.stats.totalPnlPct

            // Max drawdown
            const maxDdLimit = acc.accountSize * acc.maxDrawdownPct / 100
            const ddUsedDollar = Math.max(0, -pnlDollar)
            const ddUsedPct = maxDdLimit > 0 ? (ddUsedDollar / maxDdLimit) * 100 : 0
            const ddRemaining = maxDdLimit - ddUsedDollar

            // Profit target
            const targetDollar = acc.accountSize * acc.profitTargetPct / 100
            const targetPct = targetDollar > 0 ? (Math.max(0, pnlDollar) / targetDollar) * 100 : 0

            // Daily drawdown
            const hasDailyDD = acc.dailyDrawdownPct != null && acc.dailyDrawdownPct > 0
            const dailyLossDollar = Math.max(0, -acc.stats.dailyPnlDollar)
            const dailyDdLimit = hasDailyDD ? acc.accountSize * acc.dailyDrawdownPct / 100 : 0
            const dailyDdUsedPct = hasDailyDD && dailyDdLimit > 0 ? (dailyLossDollar / dailyDdLimit) * 100 : 0
            const dailyDdRemaining = hasDailyDD ? dailyDdLimit - dailyLossDollar : 0
            const dailyLimitBreached = hasDailyDD && dailyLossDollar >= dailyDdLimit

            const isEditing = editingId === acc.id
            const isConfirmDelete = confirmDeleteId === acc.id

            return (
              <div key={acc.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">

                {isEditing ? (
                  <div className="p-5">
                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-4">Edit — {acc.name}</p>
                    <AccountForm
                      initial={{
                        name: acc.name, broker: acc.broker,
                        accountSize: acc.accountSize, currency: acc.currency,
                        maxDrawdownPct: acc.maxDrawdownPct,
                        dailyDrawdownPct: acc.dailyDrawdownPct ?? '',
                        profitTargetPct: acc.profitTargetPct, status: acc.status,
                      }}
                      onSave={handleEdit} onCancel={() => setEditingId(null)} saving={saving} error={editError}
                    />
                  </div>

                ) : isConfirmDelete ? (
                  <div className="px-5 py-4 flex flex-wrap items-center gap-3 justify-between">
                    <div>
                      <p className="text-sm text-gray-200">Delete <span className="text-amber-400 font-semibold">{acc.name}</span>?</p>
                      <p className="text-xs text-gray-500 mt-0.5">Journal entries linked to this account will be unlinked, not deleted.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 border border-[#2a2a2a] text-gray-400 hover:text-gray-100 rounded-lg text-xs transition-colors">Cancel</button>
                      <button onClick={() => handleDelete(acc.id)} disabled={deleting}
                        className="px-4 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors">
                        {deleting ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                    </div>
                  </div>

                ) : (
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-bold text-gray-100">{acc.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${st.color} ${st.bg} ${st.border}`}>{st.label}</span>
                          {dailyLimitBreached && (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-medium">
                              <AlertTriangle size={10} /> Daily limit hit
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {acc.broker ? `${acc.broker} · ` : ''}{acc.currency} {acc.accountSize.toLocaleString()} · {acc.stats.trades} trades
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setEditingId(acc.id); setEditError('') }}
                          className="flex items-center gap-1 px-2.5 py-1.5 border border-[#2a2a2a] text-gray-400 hover:text-amber-400 hover:border-amber-400/40 rounded-lg text-xs transition-colors">
                          <Pencil size={12} /> Edit
                        </button>
                        <button onClick={() => setConfirmDeleteId(acc.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 border border-[#2a2a2a] text-gray-400 hover:text-red-400 hover:border-red-400/40 rounded-lg text-xs transition-colors">
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>

                    {/* P&L summary row */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Current P&L</p>
                        <p className={`text-xl font-bold tabular-nums ${pnlDollar >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {pnlDollar >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                        </p>
                        <p className={`text-xs ${pnlDollar >= 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
                          {pnlDollar >= 0 ? '+' : ''}{acc.currency} {Math.abs(pnlDollar).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Max DD Remaining</p>
                        <p className={`text-xl font-bold ${ddRemaining > 0 ? 'text-gray-100' : 'text-red-400'}`}>
                          {acc.currency} {Math.max(0, ddRemaining).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-gray-500">of {acc.maxDrawdownPct}% max DD</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Profit Target</p>
                        <p className="text-xl font-bold text-gray-100">
                          {acc.currency} {targetDollar.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-gray-500">{acc.profitTargetPct}% goal</p>
                      </div>
                    </div>

                    {/* Progress bars */}
                    <div className="space-y-3">
                      {/* Profit target */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span className="flex items-center gap-1"><TrendingUp size={11} className="text-green-400" /> Profit progress</span>
                          <span className="text-green-400">{Math.min(100, targetPct).toFixed(1)}%</span>
                        </div>
                        <ProgressBar pct={targetPct} color="bg-green-500" />
                      </div>

                      {/* Max drawdown */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span className="flex items-center gap-1">
                            <AlertTriangle size={11} className={ddUsedPct > 70 ? 'text-red-400' : 'text-gray-400'} />
                            Max drawdown used
                          </span>
                          <span className={ddUsedPct > 70 ? 'text-red-400' : 'text-gray-400'}>
                            {Math.min(100, ddUsedPct).toFixed(1)}%
                          </span>
                        </div>
                        <ProgressBar pct={ddUsedPct} color={ddUsedPct > 70 ? 'bg-red-500' : 'bg-orange-500'} />
                      </div>

                      {/* Daily drawdown — only shown if set */}
                      {hasDailyDD && (
                        <div className={`rounded-lg p-3 ${dailyLimitBreached ? 'bg-red-500/10 border border-red-500/20' : 'bg-[#0f0f0f]'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="flex items-center gap-1.5 text-xs font-medium">
                              <Calendar size={11} className={dailyLimitBreached ? 'text-red-400' : 'text-gray-400'} />
                              <span className={dailyLimitBreached ? 'text-red-400' : 'text-gray-400'}>Today's Daily Drawdown</span>
                            </span>
                            <div className="flex items-center gap-3 text-xs">
                              <span className={acc.stats.dailyPnlPct >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {acc.stats.dailyPnlPct >= 0 ? '+' : ''}{acc.stats.dailyPnlPct.toFixed(2)}% today
                              </span>
                              <span className={dailyLimitBreached ? 'text-red-400 font-semibold' : 'text-gray-500'}>
                                {Math.min(100, dailyDdUsedPct).toFixed(1)}% of {acc.dailyDrawdownPct}% limit
                              </span>
                            </div>
                          </div>
                          <ProgressBar
                            pct={dailyDdUsedPct}
                            color={dailyLimitBreached ? 'bg-red-500' : dailyDdUsedPct > 60 ? 'bg-orange-500' : 'bg-blue-500'}
                          />
                          <div className="flex justify-between text-xs mt-1.5">
                            <span className="text-gray-600">
                              Used: {acc.currency} {dailyLossDollar.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className={dailyLimitBreached ? 'text-red-400' : 'text-gray-600'}>
                              {dailyLimitBreached
                                ? 'Daily limit reached — stop trading today'
                                : `Remaining: ${acc.currency} ${Math.max(0, dailyDdRemaining).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
                              }
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
