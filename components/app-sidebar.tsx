"use client"

import {
  LayoutDashboard,
  Package,
  Tag,
  Ruler,
  Warehouse,
  ShoppingCart,
  RotateCcw,
  Users,
  Truck,
  CreditCard,
  Settings,
  FileText,
  Crown,
  HelpCircle,
  Building2,
  UserCog,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"

const menuItems = [
  {
    titleKey: "overview" as const,
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    titleKey: "products" as const,
    url: "/products",
    icon: Package,
  },
  {
    titleKey: "categories" as const,
    url: "/categories",
    icon: Tag,
  },
  {
    titleKey: "units" as const,
    url: "/units",
    icon: Ruler,
  },
  {
    titleKey: "inventory" as const,
    url: "/inventory",
    icon: Warehouse,
  },
  {
    titleKey: "warehouses" as const,
    url: "/warehouses",
    icon: Building2,
  },
  {
    titleKey: "orders" as const,
    url: "/orders",
    icon: ShoppingCart,
  },
  {
    titleKey: "returns" as const,
    url: "/returns",
    icon: RotateCcw,
  },
  {
    titleKey: "customers" as const,
    url: "/customers",
    icon: Users,
  },
  {
    titleKey: "suppliers" as const,
    url: "/suppliers",
    icon: Truck,
  },
  {
    titleKey: "purchaseOrders" as const,
    url: "/purchase-orders",
    icon: FileText,
  },
  {
    titleKey: "payments" as const,
    url: "/payments",
    icon: CreditCard,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const { businessId, storeId, memberships } = useAuth()

  // Trợ lý & quản lý thành viên chỉ dành cho OWNER — suy ra role từ membership hiện tại
  const isOwner = useMemo(() => {
    const m = memberships.find((x) => x.businessId === businessId)
    return (m?.stores ?? []).some((s) => s.role === "ROLE_OWNER")
  }, [memberships, businessId])

  // Tên cửa hàng đang chọn (hiển thị dưới brand ở header)
  const currentStoreName = useMemo(() => {
    const m = memberships.find((x) => x.businessId === businessId)
    return m?.stores.find((s) => s.storeId === storeId)?.storeName
  }, [memberships, businessId, storeId])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/dashboard">
                <div className="flex aspect-square size-9 items-center justify-center overflow-hidden rounded-lg">
                  <Image
                    src="/quiktech-logo-qcut.svg"
                    alt="QuikTech"
                    width={36}
                    height={36}
                    className="size-9"
                  />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold">QuikTech</span>
                  {currentStoreName && (
                    <span className="truncate text-xs text-sidebar-foreground/60">
                      {currentStoreName}
                    </span>
                  )}
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
            {t.navigation && Object.keys(t.navigation).length > 0 ? "Menu" : "Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.titleKey}
                    className="transition-colors"
                  >
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{(t.navigation as any)[item.titleKey] || item.titleKey}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isOwner && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/team"}
                    tooltip={t.navigation.team}
                    className="transition-colors"
                  >
                    <Link href="/team">
                      <UserCog className="size-4" />
                      <span>{t.navigation.team}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Help" isActive={pathname === '/help'} className="transition-colors">
              <Link href="/help">
                <HelpCircle className="size-4" />
                <span>{t.help.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Subscription" isActive={pathname === '/subscription'} className="transition-colors">
              <Link href="/subscription">
                <Crown className="size-4" />
                <span>{t.subscription.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings" isActive={pathname === '/settings'} className="transition-colors">
              <Link href="/settings">
                <Settings className="size-4" />
                <span>{t.common.settings}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
