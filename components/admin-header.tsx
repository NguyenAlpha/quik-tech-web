'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronRight, ChevronsUpDown, LogOut } from 'lucide-react'
import { adminNavItems } from '@/components/admin-sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useLanguage } from '@/lib/language-context'
import { useAdminCopy } from '@/lib/admin-copy'
import { getInitials } from '@/lib/utils'
import type { AuthUser } from '@/lib/types'

export function AdminHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const copy = useAdminCopy()
  const [user, setUser] = useState<AuthUser | null>(null)
  const currentPage = adminNavItems.find(item => item.href === pathname)

  useEffect(() => {
    const saved = localStorage.getItem('admin_user')
    if (saved) {
      try { setUser(JSON.parse(saved)) } catch { setUser(null) }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    document.cookie = 'admin_token=; path=/admin; max-age=0'
    router.replace('/admin/login')
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/95 px-3 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger aria-label={copy.toggleNavigation} />
        <Separator orientation="vertical" className="hidden h-5 sm:block" />
        <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
          <span className="hidden text-muted-foreground lg:inline">{copy.workspace}</span>
          <ChevronRight className="hidden size-3.5 text-muted-foreground lg:block" />
          <span aria-current="page" className="truncate font-medium">{currentPage ? copy[currentPage.key] : copy.workspace}</span>
        </nav>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 gap-2 px-2" aria-label={copy.account}>
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                  {user ? getInitials(user.fullName || user.username) : 'AD'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-32 truncate text-sm md:inline">{user?.fullName || user?.username || copy.account}</span>
              <ChevronsUpDown className="hidden size-3.5 text-muted-foreground md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="space-y-1 font-normal">
              <p className="truncate font-medium">{user?.fullName || user?.username || copy.account}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email || copy.workspace}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive focus:text-destructive">
              <LogOut className="size-4" />{t.common.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
