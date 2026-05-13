'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function EditVideoPage() {
  const router = useRouter()
  const { id } = useParams()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    youtubeUrl: '',
    description: '',
    categoryId: '',
    subCategoryId: '',
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/videos/${id}`).then((r) => r.json()),
      fetch('/api/admin/categories').then((r) => r.json()),
    ]).then(([video, cats]) => {
      setCategories(cats)
      setForm({
        title: video.title,
        youtubeUrl: video.youtubeUrl,
        description: video.description,
        categoryId: video.subCategory?.categoryId ?? '',
        subCategoryId: video.subCategoryId,
      })
      setFetching(false)
    })
  }, [id])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({
      ...f,
      [name]: value,
      ...(name === 'categoryId' ? { subCategoryId: '' } : {}),
    }))
  }

  const selectedCat = categories.find((c) => c.id === form.categoryId)
  const subCategories = selectedCat?.subCategories ?? []

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch(`/api/admin/videos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        youtubeUrl: form.youtubeUrl,
        description: form.description,
        subCategoryId: form.subCategoryId,
      }),
    })

    if (res.ok) {
      router.push('/admin/videos')
    } else {
      setError('Failed to update video.')
      setLoading(false)
    }
  }

  if (fetching) return <div className="skeleton h-64 rounded-xl max-w-2xl" />

  return (
    <div className="max-w-2xl">
      <Link href="/admin/videos" className="flex items-center gap-1 text-sm text-gray-400 hover:text-amber-400 transition-colors mb-6">
        <ChevronLeft size={16} />
        Back to Videos
      </Link>

      <h1 className="text-2xl font-bold text-gray-100 mb-6">Edit Video</h1>

      <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 space-y-4">
        {[
          { label: 'Title', name: 'title', type: 'text', required: true },
          { label: 'YouTube URL', name: 'youtubeUrl', type: 'url', required: true },
        ].map(({ label, ...props }) => (
          <div key={props.name}>
            <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
            <input {...props} value={form[props.name]} onChange={handleChange}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-amber-400 transition-colors" />
          </div>
        ))}

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3}
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none" />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Category</label>
          <select name="categoryId" value={form.categoryId} onChange={handleChange} required
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-amber-400">
            <option value="">Select a category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Subcategory</label>
          <select name="subCategoryId" value={form.subCategoryId} onChange={handleChange} required disabled={!form.categoryId}
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-amber-400 disabled:opacity-50">
            <option value="">Select a subcategory</option>
            {subCategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {error && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Link href="/admin/videos" className="px-6 py-2.5 border border-[#2a2a2a] text-gray-400 hover:text-gray-100 rounded-lg text-sm transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={loading}
            className="flex-1 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-black font-semibold py-2.5 rounded-lg text-sm transition-colors">
            {loading ? 'Saving...' : 'Update Video'}
          </button>
        </div>
      </form>
    </div>
  )
}
