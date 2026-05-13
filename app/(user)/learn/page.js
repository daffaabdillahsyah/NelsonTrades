import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ChevronRight, BookOpen } from 'lucide-react'

export const metadata = { title: 'Learn — NST Bootcamp' }

export default async function LearnPage() {
  const categories = await prisma.category.findMany({
    include: { subCategories: { orderBy: { order: 'asc' } } },
    orderBy: { order: 'asc' },
  })

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen size={24} className="text-amber-400" />
        <h1 className="text-2xl font-bold text-gray-100">Learning Hub</h1>
      </div>

      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2a2a2a]">
              <h2 className="font-semibold text-amber-400">{cat.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {cat.subCategories.length} section{cat.subCategories.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="divide-y divide-[#2a2a2a]">
              {cat.subCategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/learn/${cat.id}/${sub.id}`}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-[#2a2a2a] transition-colors group"
                >
                  <span className="text-sm text-gray-300 group-hover:text-gray-100 transition-colors">
                    {sub.name}
                  </span>
                  <ChevronRight size={16} className="text-gray-500 group-hover:text-amber-400 transition-colors" />
                </Link>
              ))}
              {cat.subCategories.length === 0 && (
                <p className="px-6 py-3 text-sm text-gray-500">No sections yet</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
