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
  const category = await prisma.category.findUnique({
    where: { id },
    include: { subCategories: { orderBy: { order: 'asc' } } },
  })
  if (!category) return new Response(null, { status: 404 })
  return Response.json(category)
}

export async function PUT(request, { params }) {
  if (!(await requireAdmin())) return new Response(null, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.order !== undefined && { order: body.order }),
    },
  })
  return Response.json(category)
}

export async function DELETE(request, { params }) {
  if (!(await requireAdmin())) return new Response(null, { status: 403 })

  const { id } = await params
  await prisma.category.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
