import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

export async function PUT(request, { params }) {
  if (!(await requireAdmin())) return new Response(null, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const sub = await prisma.subCategory.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.order !== undefined && { order: body.order }),
    },
  })
  return Response.json(sub)
}

export async function DELETE(request, { params }) {
  if (!(await requireAdmin())) return new Response(null, { status: 403 })

  const { id } = await params
  await prisma.subCategory.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
