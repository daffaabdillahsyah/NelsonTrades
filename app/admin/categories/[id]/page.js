'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronUp, ChevronDown } from 'lucide-react'

export default function ManageSubCategoriesPage() {
  const { id } = useParams()
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')

  async function load() {
    const res = await fetch(`/api/admin/categories/${id}`)
    const data = await res.json()
    setCategory(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function addSub() {
    if (!newName.trim()) return
    setAdding(true)
    await fetch('/api/admin/subcategories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: id, name: newName.trim() }),
    })
    setNewName('')
    setAdding(false)
    load()
  }

  async function deleteSub(subId) {
    if (!confirm('Delete this subcategory and all its videos?')) return
    await fetch(`/api/admin/subcategories/${subId}`, { method: 'DELETE' })
    load()
  }

  async function saveEdit(subId) {
    await fetch(`/api/admin/subcategories/${subId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    })
    setEditId(null)
    load()
  }

  async function moveSub(subId, direction) {
    const subs = category.subCategories
    const idx = subs.findIndex((s) => s.id === subId)
    const swapIdx = idx + (direction === 'up' ? -1 : 1)
    if (swapIdx < 0 || swapIdx >= subs.length) return
    await Promise.all([
      fetch(`/api/admin/subcategories/${subs[idx].id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: subs[swapIdx].order }),
      }),
      fetch(`/api/admin/subcategories/${subs[swapIdx].id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: subs[idx].order }),
      }),
    ])
    load()
  }

  if (loading) return <div className="skeleton h-64 rounded-xl" />

  return (
    <div className="max-w-3xl">
      <Link href="/admin/categories" className="flex items-center gap-1 text-sm text-gray-400 hover:text-amber-400 transition-colors mb-4">
        <ChevronLeft size={16} />
        Back to Categories
      </Link>

      <h1 className="text-2xl font-bold text-gray-100 mb-1">{category?.name}</h1>
      <p className="text-sm text-gray-400 mb-6">Manage subcategories</p>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addSub()}
          placeholder="New subcategory name"
          className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-amber-400"
        />
        <button
          onClick={addSub}
          disabled={adding || !newName.trim()}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-black text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      <div className="space-y-2">
        {(category?.subCategories ?? []).map((sub, idx) => (
          <div key={sub.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <button onClick={() => moveSub(sub.id, 'up')} disabled={idx === 0} className="text-gray-500 hover:text-gray-300 disabled:opacity-30 transition-colors">
                <ChevronUp size={14} />
              </button>
              <button onClick={() => moveSub(sub.id, 'down')} disabled={idx === (category?.subCategories?.length ?? 0) - 1} className="text-gray-500 hover:text-gray-300 disabled:opacity-30 transition-colors">
                <ChevronDown size={14} />
              </button>
            </div>

            {editId === sub.id ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(sub.id); if (e.key === 'Escape') setEditId(null) }}
                autoFocus
                className="flex-1 bg-[#0f0f0f] border border-amber-400 rounded px-3 py-1 text-gray-100 text-sm focus:outline-none"
              />
            ) : (
              <p className="flex-1 text-sm font-medium text-gray-100">{sub.name}</p>
            )}

            <div className="flex items-center gap-2">
              {editId === sub.id ? (
                <>
                  <button onClick={() => saveEdit(sub.id)} className="text-xs px-3 py-1 bg-amber-400 text-black rounded font-semibold">Save</button>
                  <button onClick={() => setEditId(null)} className="text-xs px-3 py-1 border border-[#2a2a2a] text-gray-400 rounded">Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setEditId(sub.id); setEditName(sub.name) }} className="text-gray-400 hover:text-amber-400 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteSub(sub.id)} className="text-gray-400 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {(category?.subCategories?.length ?? 0) === 0 && (
          <p className="text-sm text-gray-500 text-center py-6">No subcategories yet.</p>
        )}
      </div>
    </div>
  )
}
