import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET(request, { params }) {
  if (!(await requireAdmin())) return new Response(null, { status: 403 })

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, role: true, createdAt: true },
  })
  if (!user) return new Response(null, { status: 404 })

  const [entries, total, wins, losses, be] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { userId: id },
      orderBy: { tradeDate: 'desc' },
      take: 20,
    }),
    prisma.journalEntry.count({ where: { userId: id } }),
    prisma.journalEntry.count({ where: { userId: id, result: 'WIN' } }),
    prisma.journalEntry.count({ where: { userId: id, result: 'LOSS' } }),
    prisma.journalEntry.count({ where: { userId: id, result: 'BE' } }),
  ])

  const winrate = total > 0 ? Math.round((wins / total) * 100) : 0
  const totalPnl = entries.reduce((sum, e) => sum + e.pnl, 0)

  return Response.json({
    user,
    stats: { total, wins, losses, be, winrate, totalPnl: parseFloat(totalPnl.toFixed(2)) },
    entries: entries.map((e) => ({ ...e, images: JSON.parse(e.images || '[]') })),
  })
}

export async function PUT(request, { params }) {
  if (!(await requireAdmin())) return new Response(null, { status: 403 })

  const { id } = await params
  const { username, password, role } = await request.json()

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) return new Response(null, { status: 404 })

  const data = { username, role }
  if (password && password.trim().length > 0) {
    data.password = await bcrypt.hash(password, 12)
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, role: true, createdAt: true },
    })
    return Response.json(updated)
  } catch {
    return Response.json({ error: 'Username already taken.' }, { status: 409 })
  }
}

export async function DELETE(request, { params }) {
  if (!(await requireAdmin())) return new Response(null, { status: 403 })

  const { id } = await params
  const session = await getServerSession(authOptions)

  if (id === session.user.id) {
    return Response.json({ error: 'Cannot delete your own account.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return new Response(null, { status: 404 })

  await prisma.user.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
