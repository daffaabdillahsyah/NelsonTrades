import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Providers from '@/components/Providers'

export default async function UserLayout({ children }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <Providers session={session}>
      <div className="flex min-h-screen">
        <Sidebar user={session.user} />
        <main className="flex-1 md:ml-64 p-6 pt-16 md:pt-6">
          {children}
        </main>
      </div>
    </Providers>
  )
}
