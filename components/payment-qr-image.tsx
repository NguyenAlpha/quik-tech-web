'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { authenticatedFetch } from '@/lib/api'
import { clearAdminSession } from '@/lib/admin-client'
import { usePaymentAccountCopy } from '@/lib/payment-account-copy'
import { Button } from '@/components/ui/button'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export function PaymentQrImage({ url }: { url: string }) {
  const copy = usePaymentAccountCopy()
  const isAdmin = usePathname().startsWith('/admin')
  const [image, setImage] = useState<{ url: string; src: string } | null>(null)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let objectUrl: string | undefined
    setImage(null)
    setFailed(false)
    const load = async () => {
      try {
        // Only API QR paths may receive a session token, never arbitrary image URLs.
        if (!/^\/api\/(admin\/payment-accounts\/qr\/[a-f0-9-]+\.png|businesses\/\d+\/subscription\/invoices\/\d+\/qr)$/.test(url)) throw new Error('Invalid QR path')
        const response = isAdmin
          ? await fetch(`${API_BASE}${url}`, { signal: controller.signal, headers: { Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}` } })
          : await authenticatedFetch(url, { signal: controller.signal })
        if (isAdmin && response.status === 401 && !controller.signal.aborted) {
          clearAdminSession()
          window.location.assign('/admin/login')
        }
        if (!response.ok) throw new Error('Could not load QR image')
        const blob = await response.blob()
        if (controller.signal.aborted) return
        objectUrl = URL.createObjectURL(blob)
        setImage({ url, src: objectUrl })
      } catch {
        if (!controller.signal.aborted) setFailed(true)
      }
    }
    void load()
    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url, isAdmin, retry])

  return <div className="space-y-2">
    {failed ? <div role="alert" className="space-y-2 rounded-lg border p-3 text-sm text-muted-foreground">
      <p>{copy.qrLoadError}</p><Button type="button" size="sm" variant="outline" onClick={() => setRetry(value => value + 1)}>{copy.qrRetry}</Button>
    </div> : image?.url === url ?
      <img src={image.src} alt={copy.qrImage} className="h-auto max-h-72 w-auto max-w-full rounded-lg border bg-white p-3 object-contain" onError={() => setFailed(true)} /> :
      <div role="status" className="flex h-40 items-center justify-center rounded-lg border bg-muted/20"><Loader2 className="size-5 animate-spin" /><span className="sr-only">{copy.qrLoading}</span></div>}
  </div>
}
