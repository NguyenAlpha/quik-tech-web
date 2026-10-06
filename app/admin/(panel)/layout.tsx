'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'
import { AdminHeader } from '@/components/admin-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useAdminCopy } from '@/lib/admin-copy'
import { clearAdminSession, verifyAdminSession } from '@/lib/admin-client'
import { useLanguage } from '@/lib/language-context'
import { errorMessage } from '@/lib/api-error'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const copy = useAdminCopy()
  const { t } = useLanguage()
  const [checked, setChecked] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkSession = useCallback(async () => {
    setError(null)
    const token = localStorage.getItem('admin_token')
    if (!token) {
      clearAdminSession()
      router.replace('/admin/login')
      return
    }
    try {
      const user = await verifyAdminSession()
      localStorage.setItem('admin_user', JSON.stringify(user))
      setChecked(true)
    } catch (err) {
      setError(errorMessage(err, t))
    }
  }, [router, t])

  useEffect(() => { void checkSession() }, [checkSession])

  if (!checked) return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      {error ? <>
        <p role="alert" className="text-sm text-destructive">{error}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={checkSession}>{t.common.retry}</Button>
          <Button onClick={() => { clearAdminSession(); router.replace('/admin/login') }}>{t.common.logout}</Button>
        </div>
      </> : <><Loader2 className="size-6 animate-spin text-primary" /><p role="status">{t.common.loading}</p></>}
    </div>
  )

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
