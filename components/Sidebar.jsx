'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  BookOpen,
  NotebookPen,
  Wallet,
  Menu,
  X,
  LogOut,
  Shield,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/journal', label: 'Journal', icon: NotebookPen },
  { href: '/accounts', label: 'Accounts', icon: Wallet },
]

export default function Sidebar({ user }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-[#1a1a1a] border border-[#2a2a2a] p-2 rounded-lg text-gray-300"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#1a1a1a] border-r border-[#2a2a2a] z-50 flex flex-col transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="p-6 border-b border-[#2a2a2a]">
          <h1 className="text-xl font-bold text-amber-400">NST Bootcamp</h1>
          <p className="text-xs text-gray-500 mt-1">@{user?.username}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm
                  ${active
                    ? 'bg-amber-400/10 text-amber-400'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-[#2a2a2a]'
                  }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
          {user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm
                ${pathname.startsWith('/admin')
                  ? 'bg-amber-400/10 text-amber-400'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-[#2a2a2a]'
                }`}
            >
              <Shield size={18} />
              Admin Panel
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-[#2a2a2a]">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-3 py-2 w-full text-gray-400 hover:text-red-400 transition-colors rounded-lg text-sm"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
