import Link from 'next/link'
import Image from 'next/image'
import { Play } from 'lucide-react'

function getYouTubeId(url) {
  if (!url) return null
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/)
  return match ? match[1] : null
}

export default function VideoCard({ video, categoryId, subCategoryId }) {
  const id = getYouTubeId(video.youtubeUrl)
  const thumbnail = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
  const href = `/learn/${categoryId}/${subCategoryId}`

  return (
    <Link href={href}>
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden hover:border-amber-400/40 transition-colors group">
        <div className="relative aspect-video bg-[#0f0f0f]">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={video.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          ) : (
            <div className="w-full h-full bg-[#2a2a2a]" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
            <div className="bg-amber-400/80 rounded-full p-3">
              <Play fill="black" stroke="none" size={20} />
            </div>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-medium text-gray-100 line-clamp-2 text-sm">{video.title}</h3>
          {video.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{video.description}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
