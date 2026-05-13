import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET(request, { params }) {
  if (!(await requireAdmin())) return new Response(null, { status: 403 })

  const { id } = await params
  const video = await prisma.video.findUnique({
    where: { id },
    include: { subCategory: { include: { category: true } } },
  })
  if (!video) return new Response(null, { status: 404 })
  return Response.json(video)
}

export async function PUT(request, { params }) {
  if (!(await requireAdmin())) return new Response(null, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const video = await prisma.video.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.youtubeUrl !== undefined && { youtubeUrl: body.youtubeUrl }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.subCategoryId !== undefined && { subCategoryId: body.subCategoryId }),
      ...(body.order !== undefined && { order: body.order }),
    },
  })
  return Response.json(video)
}

export async function DELETE(request, { params }) {
  if (!(await requireAdmin())) return new Response(null, { status: 403 })

  const { id } = await params
  await prisma.video.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
