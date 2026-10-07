'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useLanguage } from '@/lib/language-context'
import { useNotificationCopy } from '@/lib/notification-copy'
import { errorMessage } from '@/lib/api-error'
import { formatCurrency } from '@/lib/utils'
import type { SubscriptionInvoice } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PaymentBankDetails } from '@/components/payment-bank-details'

export function NotificationInvoiceDialog() {
  return <Suspense fallback={null}><InvoiceDialog /></Suspense>
}

function InvoiceDialog() {
  const invoiceId = useSearchParams().get('invoiceId')
  const { businessId } = useAuth()
  const { t } = useLanguage()
  const copy = useNotificationCopy()
  const router = useRouter()
  const [invoice, setInvoice] = useState<SubscriptionInvoice | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    setInvoice(null)
    setError(null)
    if (!invoiceId || !businessId) return
    if (!/^[1-9]\d*$/.test(invoiceId)) { setError(new Error('Invalid invoice')); return }
    const controller = new AbortController()
    apiFetch<SubscriptionInvoice>(`/api/businesses/${businessId}/subscription/invoices/${invoiceId}`, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setInvoice(result) })
      .catch(err => { if (!controller.signal.aborted) setError(err) })
    return () => controller.abort()
  }, [invoiceId, businessId, retry])
  const close = () => router.replace('/subscription', { scroll: false })
  const statuses = { PENDING: t.subscription.statusPending, PAID: t.subscription.statusPaid, FAILED: t.subscription.statusFailed }

  return <Dialog open={!!invoiceId} onOpenChange={open => { if (!open) close() }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
    <DialogHeader><DialogTitle>{copy.invoiceTitle} #{invoiceId}</DialogTitle><DialogDescription>{copy.historyHint}</DialogDescription></DialogHeader>
    {error ? <div role="alert" className="space-y-3"><p className="text-sm text-destructive">{errorMessage(error, t, copy.invoiceError)}</p><Button variant="outline" onClick={() => setRetry(value => value + 1)}>{copy.retry}</Button></div> : invoice ? <div className="space-y-4">
      <div className="flex items-center justify-between gap-3"><span className="font-semibold">{invoice.plan} · {formatCurrency(Number(invoice.amount))}</span><Badge variant="secondary">{statuses[invoice.status]}</Badge></div>
      {invoice.bankTransferRef && <p className="break-words text-sm">{invoice.bankTransferRef}</p>}
      {invoice.adminNote && <p className="break-words rounded-lg border bg-muted/30 p-3 text-sm">{invoice.adminNote}</p>}
      <PaymentBankDetails info={invoice.bankInfo} />
    </div> : <div role="status" className="flex items-center gap-2 py-8 text-sm"><Loader2 className="size-4 animate-spin" />{copy.loading}</div>}
    <DialogFooter><Button variant="outline" onClick={close}>{copy.close}</Button></DialogFooter>
  </DialogContent></Dialog>
}
