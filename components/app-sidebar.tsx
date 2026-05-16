"use client"

import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Users,
  Truck,
  CreditCard,
  Settings,
  ChevronDown,
  Sparkles,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/lib/language-context"

const menuItems = [
  {
    titleKey: "overview" as const,
    url: "/",
    icon: LayoutDashboard,
  },
  {
    titleKey: "products" as const,
    url: "/products",
    icon: Package,
  },
  {
    titleKey: "inventory" as const,
    url: "/inventory",
    icon: Warehouse,
  },
  {
    titleKey: "orders" as const,
    url: "/orders",
    icon: ShoppingCart,
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

const stores = [
  { name: "Downtown Store", id: "store-1" },
  { name: "Mall Location", id: "store-2" },
  { name: "Online Store", id: "store-3" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
                    <Sparkles className="size-5" />
                  </div>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-semibold">StockFlow</span>
                    <span className="truncate text-xs text-sidebar-foreground/60">
                      Downtown Store
                    </span>
                  </div>
                  <ChevronDown className="ml-auto size-4 opacity-50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                align="start"
                sideOffset={8}
              >
                {stores.map((store) => (
                  <DropdownMenuItem key={store.id} className="gap-2 py-2">
                    <div className="flex size-6 items-center justify-center rounded bg-muted">
                      <Sparkles className="size-3" />
                    </div>
                    <span>{store.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings" className="transition-colors">
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
