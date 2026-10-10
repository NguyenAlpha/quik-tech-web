"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/lib/auth-context"
import { NotificationProvider } from "@/lib/notification-context"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { storeId, businessId, user, isLoading, refreshMemberships } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !storeId) {
      router.replace('/setup')
    }
  }, [isLoading, storeId])

  // Đồng bộ memberships với server mỗi lần tải trang (layout giữ nguyên khi chuyển trang trong
  // dashboard nên chỉ chạy 1 lần) — lỗi thì giữ dữ liệu cũ, 401 đã được apiFetch xử lý
  useEffect(() => {
    if (!isLoading && storeId) refreshMemberships().catch(() => {})
  }, [isLoading])

  if (isLoading || !storeId) return null

  return (
    //   SidebarProvider dùng để quản lý trạng thái của sidebar
    <NotificationProvider key={`${user?.id}:${businessId}:${storeId}`} storeId={storeId}><SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider></NotificationProvider>
  )
}
