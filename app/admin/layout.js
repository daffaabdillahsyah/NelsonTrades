import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminNav from '@/components/AdminNav'

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <header className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-amber-400 font-bold text-lg">NST Admin</span>
            <span className="text-[10px] text-gray-500 px-2 py-0.5 border border-[#2a2a2a] rounded-full uppercase tracking-wider">
              {session.user.username}
            </span>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
          >
            ← Back to App
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <AdminNav />
        {children}
      </div>
    </div>
  )
}
