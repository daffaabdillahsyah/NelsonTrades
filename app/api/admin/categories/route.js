import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) return new Response(null, { status: 403 })

  const categories = await prisma.category.findMany({
    include: { subCategories: { orderBy: { order: 'asc' } } },
    orderBy: { order: 'asc' },
  })
  return Response.json(categories)
}

export async function POST(request) {
  if (!(await requireAdmin())) return new Response(null, { status: 403 })

  const { name } = await request.json()
  const last = await prisma.category.findFirst({ orderBy: { order: 'desc' } })
  const category = await prisma.category.create({
    data: { name, order: (last?.order ?? -1) + 1 },
  })
  return Response.json(category, { status: 201 })
}
