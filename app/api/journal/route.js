import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  const session = await getServerSession(authOptions)
  if (!session) return new Response(null, { status: 401 })

  const { searchParams } = request.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 10
  const skip = (page - 1) * limit

  const [entries, total, wins] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { tradeDate: 'desc' },
      take: limit,
      skip,
    }),
    prisma.journalEntry.count({ where: { userId: session.user.id } }),
    prisma.journalEntry.count({ where: { userId: session.user.id, result: 'WIN' } }),
  ])

  const data = entries.map((e) => ({ ...e, images: JSON.parse(e.images || '[]') }))
  const winrate = total > 0 ? Math.round((wins / total) * 100) : 0

  return Response.json({ entries: data, total, page, limit, winrate })
}

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session) return new Response(null, { status: 401 })

  const body = await request.json()
  const entry = await prisma.journalEntry.create({
    data: {
      userId: session.user.id,
      fundedAccountId: body.fundedAccountId || null,
      pair: body.pair,
      direction: body.direction,
      entryPrice: parseFloat(body.entryPrice),
      exitPrice: parseFloat(body.exitPrice),
      stopLoss: parseFloat(body.stopLoss),
      takeProfit: parseFloat(body.takeProfit),
      result: body.result,
      pnl: parseFloat(body.pnl),
      notes: body.notes ?? '',
      images: JSON.stringify(body.images ?? []),
      tradeDate: new Date(body.tradeDate),
    },
  })

  return Response.json({ ...entry, images: JSON.parse(entry.images) }, { status: 201 })
}
