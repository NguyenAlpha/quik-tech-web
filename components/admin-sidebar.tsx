'use client'

import { BarChart3, Building2, CreditCard, ShieldCheck, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAdminCopy } from '@/lib/admin-copy'
import { useAdminPending } from '@/components/admin-pending-provider'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarRail, useSidebar,
} from '@/components/ui/sidebar'

export const adminNavItems = [
  { key: 'overview' as const, href: '/admin/stats', icon: BarChart3 },
  { key: 'subscriptions' as const, href: '/admin/subscriptions', icon: CreditCard },
  { key: 'businesses' as const, href: '/admin/businesses', icon: Building2 },
  { key: 'users' as const, href: '/admin/users', icon: Users },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const copy = useAdminCopy()
  const { setOpenMobile } = useSidebar()
  const { count } = useAdminPending()

  return (
    <Sidebar collapsible="icon" className="border-r">
      {/* Header */}
      <SidebarHeader className="h-16 justify-center border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="QuikTech POS">
              <Link href="/admin/stats" onClick={() => setOpenMobile(false)}>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ShieldCheck className="size-4" />
                </div>
                <div className="grid gap-0.5 leading-tight">
                  <span className="font-semibold">QuikTech POS</span>
                  <span className="text-xs text-muted-foreground">{copy.workspace}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{copy.management}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map(item => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={(pathname === item.href || pathname.startsWith(`${item.href}/`))} tooltip={copy[item.key]}
                    className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground">
                    <Link href={item.href} aria-current={(pathname === item.href || pathname.startsWith(`${item.href}/`)) ? 'page' : undefined} onClick={() => setOpenMobile(false)}>
                      <item.icon />
                      <span>{copy[item.key]}</span>
                      {item.key === 'subscriptions' && count !== null && count > 0 && <span aria-label={`${copy.invoiceQueue}: ${count}`} className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary group-data-[collapsible=icon]:hidden">{count}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t">
        <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          <ShieldCheck className="size-4 shrink-0" />
          {copy.workspace}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
