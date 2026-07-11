'use client'

import { BarChart3, Building2, CreditCard, LogOut, ShieldCheck, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/language-context'

const navItems = [
  { key: 'adminNavStats' as const, href: '/admin/stats', icon: BarChart3 },
  { key: 'adminNavSubscriptions' as const, href: '/admin/subscriptions', icon: CreditCard },
  { key: 'adminNavBusinesses' as const, href: '/admin/businesses', icon: Building2 },
  { key: 'adminNavUsers' as const, href: '/admin/users', icon: Users },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const ts = t.subscription

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    document.cookie = 'admin_token=; path=/admin; max-age=0'
    router.push('/admin/login')
  }

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-slate-800 bg-slate-950">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-slate-800 px-4 py-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-600 shadow shadow-red-900/40">
          <ShieldCheck className="size-4 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">QuikTech</p>
          <p className="text-xs text-slate-500">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-3">
        <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-slate-600">
          {ts.adminNav}
        </p>
        {navItems.map(item => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-red-600/20 text-red-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <item.icon className="size-4" />
              {ts[item.key]}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
