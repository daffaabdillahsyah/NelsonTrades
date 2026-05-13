'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function AdminVideosPage() {
  const [videos, setVideos] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('')
  const [filterSub, setFilterSub] = useState('')

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterSub) params.set('subCategoryId', filterSub)
    else if (filterCat) params.set('categoryId', filterCat)

    const [vRes, cRes] = await Promise.all([
      fetch(`/api/admin/videos?${params}`),
      fetch('/api/admin/categories'),
    ])
    setVideos(await vRes.json())
    setCategories(await cRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [filterCat, filterSub])

  async function deleteVideo(id) {
    if (!confirm('Delete this video?')) return
    await fetch(`/api/admin/videos/${id}`, { method: 'DELETE' })
    load()
  }

  const selectedCat = categories.find((c) => c.id === filterCat)
  const subCategories = selectedCat?.subCategories ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Videos</h1>
        <Link
          href="/admin/videos/new"
          className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Video
        </Link>
      </div>

      <div className="flex gap-3 mb-6">
        <select
          value={filterCat}
          onChange={(e) => { setFilterCat(e.target.value); setFilterSub('') }}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-amber-400"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {filterCat && (
          <select
            value={filterSub}
            onChange={(e) => setFilterSub(e.target.value)}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-amber-400"
          >
            <option value="">All Subcategories</option>
            {subCategories.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {videos.map((video) => (
            <div key={video.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-100 truncate">{video.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {video.subCategory?.category?.name} → {video.subCategory?.name}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/admin/videos/${video.id}/edit`} className="text-gray-400 hover:text-amber-400 transition-colors">
                  <Pencil size={14} />
                </Link>
                <button onClick={() => deleteVideo(video.id)} className="text-gray-400 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {videos.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-12">No videos found.</p>
          )}
        </div>
      )}
    </div>
  )
}
