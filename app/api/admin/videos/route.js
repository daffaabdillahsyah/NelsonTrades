import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET(request) {
  if (!(await requireAdmin())) return new Response(null, { status: 403 })

  const { searchParams } = request.nextUrl
  const subCategoryId = searchParams.get('subCategoryId')
  const categoryId = searchParams.get('categoryId')

  const where = {}
  if (subCategoryId) where.subCategoryId = subCategoryId
  if (categoryId) where.subCategory = { categoryId }

  const videos = await prisma.video.findMany({
    where,
    include: { subCategory: { include: { category: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return Response.json(videos)
}

export async function POST(request) {
  if (!(await requireAdmin())) return new Response(null, { status: 403 })

  const body = await request.json()
  const last = await prisma.video.findFirst({
    where: { subCategoryId: body.subCategoryId },
    orderBy: { order: 'desc' },
  })
  const video = await prisma.video.create({
    data: {
      subCategoryId: body.subCategoryId,
      title: body.title,
      youtubeUrl: body.youtubeUrl,
      description: body.description ?? '',
      order: (last?.order ?? -1) + 1,
    },
  })
  return Response.json(video, { status: 201 })
}
