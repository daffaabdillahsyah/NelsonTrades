import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getUser() {
  const session = await getServerSession(authOptions)
  if (!session) return null
  return session.user
}

export async function PUT(request, { params }) {
  const user = await getUser()
  if (!user) return new Response(null, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const account = await prisma.fundedAccount.findFirst({ where: { id, userId: user.id } })
  if (!account) return new Response(null, { status: 404 })

  const updated = await prisma.fundedAccount.update({
    where: { id },
    data: {
      name: body.name,
      broker: body.broker ?? '',
      accountSize: parseFloat(body.accountSize),
      currency: body.currency ?? 'USD',
      maxDrawdownPct: parseFloat(body.maxDrawdownPct),
      dailyDrawdownPct: body.dailyDrawdownPct ? parseFloat(body.dailyDrawdownPct) : null,
      profitTargetPct: parseFloat(body.profitTargetPct),
      status: body.status ?? account.status,
    },
  })

  return Response.json(updated)
}

export async function DELETE(request, { params }) {
  const user = await getUser()
  if (!user) return new Response(null, { status: 401 })

  const { id } = await params

  const account = await prisma.fundedAccount.findFirst({ where: { id, userId: user.id } })
  if (!account) return new Response(null, { status: 404 })

  // Unlink journal entries before deleting (set fundedAccountId to null)
  await prisma.journalEntry.updateMany({
    where: { fundedAccountId: id },
    data: { fundedAccountId: null },
  })

  await prisma.fundedAccount.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
