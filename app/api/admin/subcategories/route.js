import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

export async function POST(request) {
  if (!(await requireAdmin())) return new Response(null, { status: 403 })

  const { categoryId, name } = await request.json()
  const last = await prisma.subCategory.findFirst({
    where: { categoryId },
    orderBy: { order: 'desc' },
  })
  const sub = await prisma.subCategory.create({
    data: { categoryId, name, order: (last?.order ?? -1) + 1 },
  })
  return Response.json(sub, { status: 201 })
}
