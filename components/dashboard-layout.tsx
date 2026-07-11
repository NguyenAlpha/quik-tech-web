"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/lib/auth-context"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { storeId, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !storeId) {
      router.replace('/setup')
    }
  }, [isLoading, storeId])

  if (isLoading || !storeId) return null

  return (
    //   SidebarProvider dùng để quản lý trạng thái của sidebar
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
