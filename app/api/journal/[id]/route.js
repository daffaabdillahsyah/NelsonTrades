import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request, { params }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return new Response(null, { status: 401 })

  const entry = await prisma.journalEntry.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!entry) return new Response(null, { status: 404 })

  return Response.json({ ...entry, images: JSON.parse(entry.images || '[]') })
}

export async function PUT(request, { params }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return new Response(null, { status: 401 })

  const body = await request.json()
  const entry = await prisma.journalEntry.updateMany({
    where: { id, userId: session.user.id },
    data: {
      fundedAccountId: body.fundedAccountId !== undefined ? (body.fundedAccountId || null) : undefined,
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

  if (entry.count === 0) return new Response(null, { status: 404 })

  const updated = await prisma.journalEntry.findFirst({ where: { id } })
  return Response.json({ ...updated, images: JSON.parse(updated.images || '[]') })
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return new Response(null, { status: 401 })

  const result = await prisma.journalEntry.deleteMany({
    where: { id, userId: session.user.id },
  })
  if (result.count === 0) return new Response(null, { status: 404 })

  return new Response(null, { status: 204 })
}
