'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'

function getYouTubeId(url) {
  if (!url) return null
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/)
  return match ? match[1] : null
}

export default function YoutubeEmbed({ url, title }) {
  const [loaded, setLoaded] = useState(false)
  const videoId = getYouTubeId(url)

  if (!videoId) {
    return (
      <div className="relative w-full bg-[#2a2a2a] rounded-lg flex items-center justify-center"
        style={{ paddingBottom: '56.25%' }}>
        <span className="absolute text-gray-500 text-sm">Invalid YouTube URL</span>
      </div>
    )
  }

  const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`

  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-black"
      style={{ paddingBottom: '56.25%' }}>
      {!loaded ? (
        <button
          onClick={() => setLoaded(true)}
          className="absolute inset-0 w-full h-full group"
          aria-label={`Play ${title}`}
        >
          <Image
            src={thumbnail}
            alt={title ?? 'YouTube video'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
            <div className="bg-amber-400 rounded-full p-4 shadow-lg">
              <Play fill="black" stroke="none" size={28} />
            </div>
          </div>
        </button>
      ) : (
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title={title ?? 'YouTube video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  )
}
