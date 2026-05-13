import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) return new Response(null, { status: 403 })

  const [users, resultGroups] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, username: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.journalEntry.groupBy({
      by: ['userId', 'result'],
      _count: { _all: true },
    }),
  ])

  const statsMap = {}
  for (const row of resultGroups) {
    if (!statsMap[row.userId]) statsMap[row.userId] = { total: 0, wins: 0 }
    statsMap[row.userId].total += row._count._all
    if (row.result === 'WIN') statsMap[row.userId].wins += row._count._all
  }

  const withStats = users.map((u) => {
    const s = statsMap[u.id] ?? { total: 0, wins: 0 }
    return {
      ...u,
      stats: {
        total: s.total,
        wins: s.wins,
        winrate: s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0,
      },
    }
  })

  return Response.json(withStats)
}

export async function POST(request) {
  if (!(await requireAdmin())) return new Response(null, { status: 403 })

  const { username, password, role } = await request.json()
  try {
    const hash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { username, password: hash, role: role ?? 'USER' },
      select: { id: true, username: true, role: true, createdAt: true },
    })
    return Response.json(user, { status: 201 })
  } catch {
    return Response.json({ error: 'Username already taken.' }, { status: 409 })
  }
}
