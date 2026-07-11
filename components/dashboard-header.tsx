"use client"

import { Search, Bell, Command, LogOut, Package, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { getInitials } from "@/lib/utils"
import { getNotificationSummary, getLowStockNotifications, type LowStockItem, type NotificationSummary } from "@/lib/api"
import { useEffect, useState, useCallback } from "react"

export function DashboardHeader() {
  const { t } = useLanguage()
  const { user, logout } = useAuth()
  const [summary, setSummary] = useState<NotificationSummary | null>(null)
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const fetchSummary = useCallback(async () => {
    try {
      const data = await getNotificationSummary()
      setSummary(data)
    } catch {
      // silently ignore — header polling should not disrupt the UI
    }
  }, [])

  useEffect(() => {
    fetchSummary()
    const id = setInterval(fetchSummary, 60_000)
    return () => clearInterval(id)
  }, [fetchSummary])

  const handleDropdownOpen = async (open: boolean) => {
    setDropdownOpen(open)
    if (open && (summary?.lowStockCount ?? 0) > 0) {
      try {
        const items = await getLowStockNotifications()
        setLowStockItems(items)
      } catch {
        // ignore
      }
    }
  }

  const totalUnread = (summary?.lowStockCount ?? 0) + (summary?.pendingInvoiceCount ?? 0)

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-background/95 px-3 sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-2" />
      <Separator orientation="vertical" className="h-5" />

      <div className="flex flex-1 items-center gap-4">
        <button className="group hidden h-9 w-full max-w-sm items-center gap-2 rounded-lg border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60 sm:flex">
          <Search className="size-4" />
          <span className="flex-1 text-left">{t.header.search}</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            <Command className="size-3" />K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
        <DropdownMenu open={dropdownOpen} onOpenChange={handleDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative size-9">
              <Bell className="size-4" />
              {totalUnread > 0 && (
                <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
              <span className="sr-only">{t.header.notifications}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 sm:w-80">
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t.header.notifications}</span>
                {totalUnread > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {totalUnread} {t.header.unread}
                  </span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {totalUnread === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {t.header.noNotifications}
              </div>
            ) : (
              <>
                {(summary?.lowStockCount ?? 0) > 0 && (
                  <>
                    <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-default" onSelect={(e) => e.preventDefault()}>
                      <div className="flex items-center gap-2">
                        <Package className="size-4 text-amber-500" />
                        <span className="text-sm font-medium">{t.header.lowStockAlert}</span>
                      </div>
                      <span className="text-xs text-muted-foreground pl-6">
                        {summary!.lowStockCount} {t.header.lowStockDesc}
                      </span>
                    </DropdownMenuItem>
                    {lowStockItems.map((item, i) => (
                      <DropdownMenuItem key={i} className="flex flex-col items-start gap-0.5 py-2 pl-8 cursor-default" onSelect={(e) => e.preventDefault()}>
                        <span className="text-xs font-medium">{item.productName}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.sku} · {item.warehouseName} · {item.quantity}/{item.minStockLevel}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                {(summary?.pendingInvoiceCount ?? 0) > 0 && (
                  <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-default" onSelect={(e) => e.preventDefault()}>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="size-4 text-blue-500" />
                      <span className="text-sm font-medium">{t.header.pendingInvoices}</span>
                    </div>
                    <span className="text-xs text-muted-foreground pl-6">
                      {summary!.pendingInvoiceCount} {t.header.pendingInvoicesDesc}
                    </span>
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="mx-2 h-5" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 gap-2 pl-2 pr-3">
              <Avatar className="size-7 border">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-medium text-white">
                  {user ? getInitials(user.fullName) : 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline-block">
                {user?.fullName ?? ''}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{user?.fullName}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-red-600 focus:text-red-600"
              onClick={logout}
            >
              <LogOut className="size-4" />
              {t.common.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
