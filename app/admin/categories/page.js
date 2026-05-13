'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')

  async function load() {
    const res = await fetch('/api/admin/categories')
    const data = await res.json()
    setCategories(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addCategory() {
    if (!newName.trim()) return
    setAdding(true)
    await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    setNewName('')
    setAdding(false)
    load()
  }

  async function deleteCategory(id) {
    if (!confirm('Delete this category and all its subcategories and videos?')) return
    await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    load()
  }

  async function saveEdit(id) {
    await fetch(`/api/admin/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    })
    setEditId(null)
    load()
  }

  async function moveCategory(id, direction) {
    const idx = categories.findIndex((c) => c.id === id)
    const swapIdx = idx + (direction === 'up' ? -1 : 1)
    if (swapIdx < 0 || swapIdx >= categories.length) return

    const a = categories[idx]
    const b = categories[swapIdx]
    await Promise.all([
      fetch(`/api/admin/categories/${a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: b.order }),
      }),
      fetch(`/api/admin/categories/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: a.order }),
      }),
    ])
    load()
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Categories</h1>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCategory()}
          placeholder="New category name"
          className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-amber-400"
        />
        <button
          onClick={addCategory}
          disabled={adding || !newName.trim()}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-black text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((cat, idx) => (
          <div key={cat.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <button onClick={() => moveCategory(cat.id, 'up')} disabled={idx === 0} className="text-gray-500 hover:text-gray-300 disabled:opacity-30 transition-colors">
                <ChevronUp size={14} />
              </button>
              <button onClick={() => moveCategory(cat.id, 'down')} disabled={idx === categories.length - 1} className="text-gray-500 hover:text-gray-300 disabled:opacity-30 transition-colors">
                <ChevronDown size={14} />
              </button>
            </div>

            {editId === cat.id ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(cat.id); if (e.key === 'Escape') setEditId(null) }}
                autoFocus
                className="flex-1 bg-[#0f0f0f] border border-amber-400 rounded px-3 py-1 text-gray-100 text-sm focus:outline-none"
              />
            ) : (
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-100">{cat.name}</p>
                <p className="text-xs text-gray-500">{cat.subCategories?.length ?? 0} subcategories</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              {editId === cat.id ? (
                <>
                  <button onClick={() => saveEdit(cat.id)} className="text-xs px-3 py-1 bg-amber-400 text-black rounded font-semibold">Save</button>
                  <button onClick={() => setEditId(null)} className="text-xs px-3 py-1 border border-[#2a2a2a] text-gray-400 rounded">Cancel</button>
                </>
              ) : (
                <>
                  <Link href={`/admin/categories/${cat.id}`} className="text-gray-400 hover:text-amber-400 transition-colors text-xs border border-[#2a2a2a] px-2 py-1 rounded">
                    Subcategories
                  </Link>
                  <button onClick={() => { setEditId(cat.id); setEditName(cat.name) }} className="text-gray-400 hover:text-amber-400 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteCategory(cat.id)} className="text-gray-400 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
