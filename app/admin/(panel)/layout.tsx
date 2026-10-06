'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'
import { AdminHeader } from '@/components/admin-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useAdminCopy } from '@/lib/admin-copy'

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const copy = useAdminCopy()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.replace('/admin/login')
    } else {
      setChecked(true)
    }
  }, [router])

  if (!checked) return null

  return (
    <SidebarProvider>
      <a href="#admin-content" className="sr-only z-50 rounded-md bg-background p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        {copy.skipToContent}
      </a>
      <AdminSidebar />
      <SidebarInset className="min-w-0 bg-background">
        <AdminHeader />
        <main id="admin-content" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
