import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getUser() {
  const session = await getServerSession(authOptions)
  if (!session) return null
  return session.user
}

// Today's UTC date range — daily DD resets at UTC midnight
function todayRange() {
  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { start, end }
}

export async function GET() {
  const user = await getUser()
  if (!user) return new Response(null, { status: 401 })

  const accounts = await prisma.fundedAccount.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  const { start: todayStart, end: todayEnd } = todayRange()

  const withStats = await Promise.all(
    accounts.map(async (acc) => {
      const [entries, todayEntries] = await Promise.all([
        prisma.journalEntry.findMany({
          where: { fundedAccountId: acc.id },
          select: { pnl: true, result: true },
        }),
        prisma.journalEntry.findMany({
          where: {
            fundedAccountId: acc.id,
            tradeDate: { gte: todayStart, lt: todayEnd },
          },
          select: { pnl: true },
        }),
      ])

      const totalPnlPct = entries.reduce((s, e) => s + e.pnl, 0)
      const totalPnlDollar = (totalPnlPct / 100) * acc.accountSize
      const wins = entries.filter((e) => e.result === 'WIN').length
      const losses = entries.filter((e) => e.result === 'LOSS').length
      const winrate = entries.length > 0 ? Math.round((wins / entries.length) * 100) : 0
      const dailyPnlPct = todayEntries.reduce((s, e) => s + e.pnl, 0)
      const dailyPnlDollar = (dailyPnlPct / 100) * acc.accountSize

      return {
        ...acc,
        stats: {
          trades: entries.length,
          wins,
          losses,
          winrate,
          totalPnlPct: parseFloat(totalPnlPct.toFixed(2)),
          totalPnlDollar: parseFloat(totalPnlDollar.toFixed(2)),
          dailyPnlPct: parseFloat(dailyPnlPct.toFixed(2)),
          dailyPnlDollar: parseFloat(dailyPnlDollar.toFixed(2)),
        },
      }
    })
  )

  return Response.json(withStats)
}

export async function POST(request) {
  const user = await getUser()
  if (!user) return new Response(null, { status: 401 })

  const { name, broker, accountSize, currency, maxDrawdownPct, dailyDrawdownPct, profitTargetPct } =
    await request.json()

  const account = await prisma.fundedAccount.create({
    data: {
      userId: user.id,
      name,
      broker: broker ?? '',
      accountSize: parseFloat(accountSize),
      currency: currency ?? 'USD',
      maxDrawdownPct: parseFloat(maxDrawdownPct),
      dailyDrawdownPct: dailyDrawdownPct ? parseFloat(dailyDrawdownPct) : null,
      profitTargetPct: parseFloat(profitTargetPct),
    },
  })

  return Response.json(account, { status: 201 })
}
