'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { AdminTableState } from '@/components/admin-table-state'
import {
  AdminPlanBadge,
  AdminSubscriptionStatus
} from '@/components/admin-subscription-badges'
import { AdminInvoiceHistory } from '@/components/admin-invoice-history'
import { useAdminUrl } from '@/hooks/use-admin-url'
import { useAdminCopy } from '@/lib/admin-copy'
import { useLanguage } from '@/lib/language-context'
import { errorMessage } from '@/lib/api-error'
import {
  getAdminBusiness,
  getAdminBusinessInvoices,
  type AdminBusinessDetail
} from '@/lib/admin-client'
import type { PagedResult, SubscriptionInvoice } from '@/lib/types'

function BusinessDetail() {
  const id = Number(useParams<{ id: string }>().id)
  const validId = Number.isSafeInteger(id) && id > 0
  const { params, update, page } = useAdminUrl()
  const tab = ['stores', 'invoices'].includes(params.get('tab') || '')
    ? params.get('tab')!
    : 'details'
  const copy = useAdminCopy()
  const { t, language } = useLanguage()
  const [detail, setDetail] = useState<AdminBusinessDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)
  const [invoices, setInvoices] =
    useState<PagedResult<SubscriptionInvoice> | null>(null)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)
  const [invoiceLoading, setInvoiceLoading] = useState(true)
  const [invoiceReload, setInvoiceReload] = useState(0)

  useEffect(() => {
    if (!validId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    getAdminBusiness(id)
      .then((value) => {
        if (!cancelled) setDetail(value)
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
  }, [id, validId, reload, t])

  useEffect(() => {
    if (!validId || tab !== 'invoices') return
    let cancelled = false
    setInvoiceLoading(true)
    setInvoiceError(null)
    getAdminBusinessInvoices(id, page)
      .then((value) => {
        if (!cancelled) setInvoices(value)
      })
      .catch((err) => {
        if (!cancelled)
          setInvoiceError(errorMessage(err, t, t.subscription.loadError))
      })
      .finally(() => {
        if (!cancelled) setInvoiceLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, validId, tab, page, invoiceReload, t])

  const date = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString(
          language === 'vi' ? 'vi-VN' : 'en-US'
        )
      : t.subscription.never
  const fields = detail
    ? [
        [copy.address, detail.business.address],
        [copy.phone, detail.business.phone],
        [copy.email, detail.business.email],
        [copy.created, date(detail.business.createdAt)]
      ]
    : []
  const limits = detail
    ? [
        [copy.stores, detail.subscription.maxStores],
        [copy.staff, detail.subscription.maxStaff],
        [copy.products, detail.subscription.maxProducts],
        [copy.warehouses, detail.subscription.maxWarehouses]
      ]
    : []

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      <Button variant="ghost" asChild>
        <Link href="/admin/businesses">
          <ArrowLeft className="size-4" />
          {copy.backToBusinesses}
        </Link>
      </Button>
      {!validId ? (
        <p role="alert">{copy.invalidBusiness}</p>
      ) : loading ? (
        <div className="flex items-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          {t.common.loading}
        </div>
      ) : error ? (
        <div role="alert" className="space-y-3 rounded-xl border p-6">
          <p>{error}</p>
          <Button
            variant="outline"
            onClick={() => setReload((value) => value + 1)}
          >
            {t.common.retry}
          </Button>
        </div>
      ) : (
        detail && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <PageHeader
                  title={detail.business.name}
                  subtitle={`${copy.businessDetails} · #${id}`}
                />
                <Badge variant="secondary" className="mt-3">
                  {detail.business.isActive ? copy.active : copy.cancelled}
                </Badge>
              </div>
              <Button asChild>
                <Link
                  href={`/admin/subscriptions?tab=override&businessId=${id}`}
                >
                  {copy.overridePlan}
                </Link>
              </Button>
            </div>
            <Tabs
              value={tab}
              onValueChange={(value) => update({ tab: value, page: null })}
              className="gap-5"
            >
              <TabsList className="h-auto flex-wrap">
                <TabsTrigger value="details">{copy.details}</TabsTrigger>
                <TabsTrigger value="stores">
                  {copy.stores} ({detail.stores.length})
                </TabsTrigger>
                <TabsTrigger value="invoices">{copy.invoices}</TabsTrigger>
              </TabsList>
              <TabsContent
                value="details"
                className="grid gap-5 lg:grid-cols-2"
              >
                <section className="rounded-xl border bg-card p-5 shadow-sm">
                  <h2 className="mb-5 font-semibold">{copy.contact}</h2>
                  <dl className="grid gap-5 sm:grid-cols-2">
                    {fields.map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-sm text-muted-foreground">
                          {label}
                        </dt>
                        <dd className="mt-1 break-words text-sm font-medium">
                          {value || '—'}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
                <section className="space-y-5 rounded-xl border bg-card p-5 shadow-sm">
                  <h2 className="font-semibold">
                    {t.subscription.currentPlanLabel}
                  </h2>
                  <div className="flex gap-2">
                    <AdminPlanBadge plan={detail.subscription.plan} />
                    <AdminSubscriptionStatus
                      status={detail.subscription.status}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t.subscription.expiresLabel}:{' '}
                    {date(detail.subscription.expiresAt)}
                  </p>
                  <h3 className="text-sm font-medium">{copy.planLimits}</h3>
                  <dl className="grid grid-cols-2 gap-4">
                    {limits.map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-sm text-muted-foreground">
                          {label}
                        </dt>
                        <dd className="mt-1 font-semibold tabular-nums">
                          {value ?? copy.unlimited}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </TabsContent>
              <TabsContent
                value="stores"
                className="overflow-hidden rounded-xl border bg-card shadow-sm"
              >
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>{copy.stores}</TableHead>
                      <TableHead>{copy.address}</TableHead>
                      <TableHead>{copy.phone}</TableHead>
                      <TableHead>{copy.email}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!detail.stores.length ? (
                      <AdminTableState
                        columns={4}
                        loading={false}
                        error={null}
                        onRetry={() => setReload((value) => value + 1)}
                        emptyMessage={copy.noStores}
                      />
                    ) : (
                      detail.stores.map((store) => (
                        <TableRow key={store.id}>
                          <TableCell className="font-medium">
                            {store.name}
                            <p className="text-xs text-muted-foreground">
                              #{store.id}
                            </p>
                          </TableCell>
                          <TableCell className="min-w-40 whitespace-normal">
                            {store.address || '—'}
                          </TableCell>
                          <TableCell>{store.phone || '—'}</TableCell>
                          <TableCell>{store.email || '—'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="invoices">
                <AdminInvoiceHistory
                  invoices={invoices?.content ?? []}
                  loading={invoiceLoading}
                  error={invoiceError}
                  page={page}
                  totalPages={invoices?.totalPages ?? 0}
                  onPageChange={(value) => update({ page: value })}
                  onRetry={() => setInvoiceReload((value) => value + 1)}
                />
              </TabsContent>
            </Tabs>
          </>
        )
      )}
    </div>
  )
}

export default function AdminBusinessPage() {
  return (
    <Suspense>
      <BusinessDetail />
    </Suspense>
  )
}
