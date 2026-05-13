'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export default function DeleteJournalButton({ id }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/journal/${id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/journal')
      router.refresh()
    } else {
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Delete this entry?</span>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 border border-[#2a2a2a] text-gray-400 hover:text-gray-100 rounded-lg text-xs transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          {deleting ? 'Deleting...' : 'Confirm'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-red-400/40 text-gray-300 hover:text-red-400 rounded-lg text-sm transition-colors"
    >
      <Trash2 size={14} />
      Delete
    </button>
  )
}
