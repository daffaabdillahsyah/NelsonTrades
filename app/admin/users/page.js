'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Plus, ShieldCheck, User, BarChart2, Pencil, Trash2, X, Check,
} from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const [showAddForm, setShowAddForm] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [addForm, setAddForm] = useState({ username: '', password: '', role: 'USER' })

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ username: '', password: '', role: 'USER' })
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)

  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function load() {
    const res = await fetch('/api/admin/users')
    setUsers(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    setAdding(true)
    setAddError('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    })
    if (res.ok) {
      setAddForm({ username: '', password: '', role: 'USER' })
      setShowAddForm(false)
      load()
    } else {
      const data = await res.json().catch(() => ({}))
      setAddError(data.error ?? 'Failed to create user.')
    }
    setAdding(false)
  }

  function startEdit(user) {
    setEditingId(user.id)
    setEditForm({ username: user.username, password: '', role: user.role })
    setEditError('')
    setConfirmDeleteId(null)
  }

  async function handleEdit(e) {
    e.preventDefault()
    setSaving(true)
    setEditError('')
    const res = await fetch(`/api/admin/users/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    if (res.ok) {
      setEditingId(null)
      load()
    } else {
      const data = await res.json().catch(() => ({}))
      setEditError(data.error ?? 'Failed to update user.')
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    setDeleting(true)
    setDeleteError('')
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setConfirmDeleteId(null)
      load()
    } else {
      const data = await res.json().catch(() => ({}))
      setDeleteError(data.error ?? 'Failed to delete user.')
    }
    setDeleting(false)
  }

  return (
    <div className="max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-100">Users</h1>
        <button
          onClick={() => { setShowAddForm(!showAddForm); setAddError('') }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add User
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-4 space-y-4">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">New User</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Username', name: 'username', type: 'text', required: true },
              { label: 'Password', name: 'password', type: 'password', required: true },
            ].map(({ label, ...props }) => (
              <div key={props.name}>
                <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
                <input
                  {...props}
                  value={addForm[props.name]}
                  onChange={(e) => setAddForm((f) => ({ ...f, [e.target.name]: e.target.value }))}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-gray-100 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Role</label>
              <select
                value={addForm.role}
                onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
                className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-gray-100 text-sm focus:outline-none focus:border-amber-400"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            {addError && <p className="text-red-400 text-xs mt-4">{addError}</p>}
            <div className="flex gap-2 ml-auto mt-4">
              <button type="button" onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-[#2a2a2a] text-gray-400 hover:text-gray-100 rounded-lg text-sm transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={adding}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-black text-sm font-semibold rounded-lg transition-colors">
                {adding ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* User list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">

              {editingId === user.id ? (
                <form onSubmit={handleEdit} className="p-4 space-y-3">
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Edit — @{user.username}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Username</label>
                      <input
                        type="text" required value={editForm.username}
                        onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
                        className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-gray-100 text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">New Password <span className="text-gray-600">(blank = unchanged)</span></label>
                      <input
                        type="password" value={editForm.password} placeholder="Leave blank to keep"
                        onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                        className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-gray-100 text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Role</label>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                        className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-gray-100 text-sm focus:outline-none focus:border-amber-400"
                      >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                  </div>
                  {editError && <p className="text-red-400 text-xs">{editError}</p>}
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setEditingId(null)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2a2a2a] text-gray-400 hover:text-gray-100 rounded-lg text-xs transition-colors">
                      <X size={12} /> Cancel
                    </button>
                    <button type="submit" disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-black text-xs font-semibold rounded-lg transition-colors">
                      <Check size={12} /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>

              ) : confirmDeleteId === user.id ? (
                <div className="px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
                  <div>
                    <p className="text-sm text-gray-200">
                      Delete <span className="text-amber-400 font-semibold">@{user.username}</span>?
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">This will permanently delete the account and all journal entries.</p>
                    {deleteError && <p className="text-red-400 text-xs mt-1">{deleteError}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setConfirmDeleteId(null); setDeleteError('') }}
                      className="px-3 py-1.5 border border-[#2a2a2a] text-gray-400 hover:text-gray-100 rounded-lg text-xs transition-colors">
                      Cancel
                    </button>
                    <button onClick={() => handleDelete(user.id)} disabled={deleting}
                      className="px-4 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors">
                      {deleting ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                  </div>
                </div>

              ) : (
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${user.role === 'ADMIN' ? 'bg-amber-400/10' : 'bg-gray-400/10'}`}>
                    {user.role === 'ADMIN'
                      ? <ShieldCheck size={16} className="text-amber-400" />
                      : <User size={16} className="text-gray-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-100">{user.username}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {user.role} · Joined {new Date(user.createdAt).toLocaleDateString()}
                      {user.stats.total > 0 && (
                        <span className="ml-1">
                          · {user.stats.total} trades
                          · <span className={user.stats.winrate >= 50 ? 'text-green-400' : 'text-red-400'}>
                              {user.stats.winrate}% WR
                            </span>
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-[#2a2a2a] text-gray-400 hover:text-amber-400 hover:border-amber-400/40 rounded-lg text-xs transition-colors"
                    >
                      <BarChart2 size={12} /> Progress
                    </Link>
                    <button
                      onClick={() => startEdit(user)}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-[#2a2a2a] text-gray-400 hover:text-amber-400 hover:border-amber-400/40 rounded-lg text-xs transition-colors"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      onClick={() => { setConfirmDeleteId(user.id); setDeleteError(''); setEditingId(null) }}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-[#2a2a2a] text-gray-400 hover:text-red-400 hover:border-red-400/40 rounded-lg text-xs transition-colors"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
