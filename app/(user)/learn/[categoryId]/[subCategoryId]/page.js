import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import YoutubeEmbed from '@/components/YoutubeEmbed'
import Link from 'next/link'
import { ChevronLeft, ExternalLink } from 'lucide-react'

export default async function SubCategoryPage({ params }) {
  const { categoryId, subCategoryId } = await params

  const subCategory = await prisma.subCategory.findFirst({
    where: { id: subCategoryId, categoryId },
    include: {
      category: true,
      videos: { orderBy: { order: 'asc' } },
    },
  })

  if (!subCategory) notFound()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/learn"
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-amber-400 transition-colors mb-3"
        >
          <ChevronLeft size={16} />
          Back to Learning Hub
        </Link>
        <p className="text-amber-400 text-sm font-medium">{subCategory.category.name}</p>
        <h1 className="text-2xl font-bold text-gray-100 mt-1">{subCategory.name}</h1>
        <p className="text-sm text-gray-400 mt-1">
          {subCategory.videos.length} video{subCategory.videos.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-8">
        {subCategory.videos.map((video) => (
          <div key={video.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
            <div className="p-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">{video.title}</h2>
              <YoutubeEmbed url={video.youtubeUrl} title={video.title} />
            </div>
            <div className="px-6 pb-6 flex items-start justify-between gap-4 mt-2">
              {video.description ? (
                <p className="text-sm text-gray-400 flex-1">{video.description}</p>
              ) : (
                <span />
              )}
              <a
                href={video.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black text-sm font-medium rounded-lg transition-colors shrink-0"
              >
                <ExternalLink size={14} />
                Open in YouTube
              </a>
            </div>
          </div>
        ))}

        {subCategory.videos.length === 0 && (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-12 text-center">
            <p className="text-gray-400">No videos in this section yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
