'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { useAdminUrl } from '@/hooks/use-admin-url'
import { adminRequest } from '@/lib/admin-client'
import { useAdminCopy } from '@/lib/admin-copy'
import { useLanguage } from '@/lib/language-context'
import { errorMessage } from '@/lib/api-error'
import { AdminInvoiceHistory } from '@/components/admin-invoice-history'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type { PagedResult, SubscriptionInvoice } from '@/lib/types'

export function AdminInvoiceSearch() {
  const { params, update, page } = useAdminUrl()
  const q = params.get('q') || ''
  const status = ['PENDING', 'PAID', 'FAILED'].includes(
    params.get('status') || ''
  )
    ? params.get('status')!
    : 'ALL'
  const [search, setSearch] = useState(q)
  const [result, setResult] = useState<PagedResult<SubscriptionInvoice> | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const copy = useAdminCopy()
  const { t } = useLanguage()
  useEffect(() => {
    setSearch(q)
  }, [q])
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const query = new URLSearchParams({ page: String(page), size: '20', q })
    if (status !== 'ALL') query.set('status', status)
    adminRequest<PagedResult<SubscriptionInvoice>>(
      `/api/admin/subscriptions/invoices?${query}`
    )
      .then((value) => {
        if (!cancelled) setResult(value)
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, t, t.subscription.loadError))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [q, status, page, reload, t])
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <form
          className="flex min-w-0 flex-1 gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            update({ q: search.trim(), page: null })
          }}
        >
          <Input
            aria-label={copy.invoiceSearch}
            placeholder={copy.invoiceSearch}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            maxLength={100}
            className="min-w-40 bg-card"
          />
          <Button type="submit" variant="outline" aria-label={copy.search}>
            <Search className="size-4" />
          </Button>
        </form>
        <Select
          value={status}
          onValueChange={(value) =>
            update({ status: value === 'ALL' ? null : value, page: null })
          }
        >
          <SelectTrigger
            aria-label={copy.invoiceStatus}
            className="w-48 bg-card"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{copy.allStatuses}</SelectItem>
            <SelectItem value="PENDING">{copy.pending}</SelectItem>
            <SelectItem value="PAID">{copy.paid}</SelectItem>
            <SelectItem value="FAILED">{copy.failed}</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => setReload((value) => value + 1)}
        >
          <RefreshCw className="size-4" />
          {copy.refresh}
        </Button>
      </div>
      {!loading && !error && (
        <p role="status" className="text-sm text-muted-foreground">
          {result?.totalElements ?? 0} {copy.results}
        </p>
      )}
      <AdminInvoiceHistory
        invoices={result?.content ?? []}
        loading={loading}
        error={error}
        page={page}
        totalPages={result?.totalPages ?? 0}
        onPageChange={(value) => update({ page: value })}
        onRetry={() => setReload((value) => value + 1)}
      />
    </div>
  )
}
