'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderOpen, Video, Users } from 'lucide-react'

const navLinks = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
  { href: '/admin/videos', label: 'Videos', icon: Video },
  { href: '/admin/users', label: 'Users', icon: Users },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 mb-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-1 w-fit">
      {navLinks.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-amber-400/10 text-amber-400'
                : 'text-gray-400 hover:text-gray-100 hover:bg-[#2a2a2a]'
            }`}
          >
            <Icon size={15} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
