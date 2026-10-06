'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Search, Building2, AlertTriangle, RefreshCw, ArrowUpRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useLanguage } from '@/lib/language-context'
import { PageHeader } from '@/components/page-header'
import { AdminTableState } from '@/components/admin-table-state'
import { AdminPlanBadge, AdminSubscriptionStatus } from '@/components/admin-subscription-badges'
import { useAdminCopy } from '@/lib/admin-copy'
import { errorMessage } from '@/lib/api-error'
import { adminGetBusinesses, adminGetSubscription, adminChangePlan } from '@/lib/api'
import type { Business, BusinessSubscription } from '@/lib/types'

interface BusinessWithSub extends Business {
  sub?: BusinessSubscription
}

export default function AdminBusinessesPage() {
  const { t, language } = useLanguage()
  const copy = useAdminCopy()
  const locale = language === 'vi' ? 'vi-VN' : 'en-US'
  const ts = t.subscription

  const [businesses, setBusinesses] = useState<BusinessWithSub[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [reload, setReload] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [selected, setSelected] = useState<BusinessWithSub | null>(null)
  const [isSubLoading, setIsSubLoading] = useState(false)
  const [newPlan, setNewPlan] = useState('')
  const [newCycle, setNewCycle] = useState('MONTHLY')
  const [isChangingPlan, setIsChangingPlan] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)
    adminGetBusinesses()
      .then(async (list) => {
        if (cancelled) return
        setBusinesses(list.map((b) => ({ ...b })))
        const results = await Promise.allSettled(list.map((b) => adminGetSubscription(b.id)))
        if (cancelled) return
        setBusinesses(
          list.map((b, i) => {
            const r = results[i]
            return r.status === 'fulfilled' ? { ...b, sub: r.value } : { ...b }
          })
        )
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, t, ts.businessesLoadError))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reload, t, ts.businessesLoadError])

  const openDetail = async (b: BusinessWithSub) => {
    setSelected(b)
    setDetailError(null)
    if (!b.sub) {
      setIsSubLoading(true)
      try {
        const sub = await adminGetSubscription(b.id)
        const updated = { ...b, sub }
        setBusinesses((prev) => prev.map((x) => (x.id === b.id ? updated : x)))
        setSelected(updated)
        setNewPlan(sub.plan)
        setNewCycle(sub.billingCycle ?? 'MONTHLY')
      } catch (err) {
        setDetailError(errorMessage(err, t, ts.loadError))
        setNewPlan('')
      } finally {
        setIsSubLoading(false)
      }
    } else {
      setNewPlan(b.sub.plan)
      setNewCycle(b.sub.billingCycle ?? 'MONTHLY')
    }
  }

  const handleChangePlan = async () => {
    if (!selected || !newPlan || isChangingPlan) return
    setIsChangingPlan(true)
    try {
      // billingCycle chỉ gửi với gói trả phí — backend từ chối khi thiếu (400)
      const updated = await adminChangePlan(selected.id, newPlan, newPlan === 'FREE' ? undefined : newCycle)
      const updatedBusiness = { ...selected, sub: updated }
      setBusinesses((prev) => prev.map((x) => (x.id === selected.id ? updatedBusiness : x)))
      setSelected(updatedBusiness)
      toast.success(ts.changePlanSuccess)
    } catch (err) {
      toast.error(errorMessage(err, t, ts.changePlanError))
    } finally {
      setIsChangingPlan(false)
    }
  }

  const filtered = search.trim()
    ? businesses.filter(
        (b) => b.name.toLowerCase().includes(search.trim().toLowerCase()) || String(b.id).includes(search.trim())
      )
    : businesses

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={copy.businesses} subtitle={copy.businessSubtitle}>
        <Button
          variant="outline"
          className="gap-2 self-start"
          disabled={isLoading}
          onClick={() => setReload((value) => value + 1)}
        >
          <RefreshCw className="size-4" />
          {copy.refresh}
        </Button>
      </PageHeader>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:px-5">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="bg-background pl-9"
              aria-label={copy.businessSearch}
              placeholder={copy.businessSearch}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          {!isLoading && !error && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {filtered.length} / {businesses.length} {copy.results}
            </span>
          )}
        </div>
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="pl-5 text-muted-foreground">{copy.businessName}</TableHead>
              <TableHead className="text-muted-foreground">{ts.businessesColPlan}</TableHead>
              <TableHead className="text-muted-foreground">{ts.businessesColStatus}</TableHead>
              <TableHead className="text-muted-foreground">{ts.businessesColExpiry}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || error || filtered.length === 0 ? (
              <AdminTableState
                columns={4}
                loading={isLoading}
                error={error}
                emptyMessage={ts.businessesNoData}
                onRetry={() => setReload((value) => value + 1)}
              />
            ) : (
              filtered.map((b) => (
                <TableRow key={b.id} className="border-border hover:bg-muted/50">
                  <TableCell className="py-4 pl-5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="size-4 text-primary" />
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => openDetail(b)}
                          className="flex items-center gap-2 rounded-sm text-left text-sm font-medium text-foreground hover:text-primary"
                        >
                          <span>{b.name}</span>
                          <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />
                        </button>
                        <p className="text-xs text-muted-foreground">#{b.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {b.sub ? (
                      <AdminPlanBadge plan={b.sub.plan} />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {b.sub ? (
                      <AdminSubscriptionStatus status={b.sub.status} />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {b.sub?.expiresAt ? new Date(b.sub.expiresAt).toLocaleDateString(locale) : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Modal */}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open && !isChangingPlan) setSelected(null)
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="size-4 text-primary" />
              {selected?.name}
            </DialogTitle>
            <DialogDescription>
              {copy.businessDetails} · #{selected?.id}
            </DialogDescription>
          </DialogHeader>

          {isSubLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : selected?.sub ? (
            <div className="space-y-4">
              {/* Subscription info */}
              <div className="rounded-lg border border-border bg-muted/50 p-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{ts.currentPlanLabel}</p>
                  <AdminPlanBadge plan={selected.sub.plan} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{ts.currentStatusLabel}</p>
                  <AdminSubscriptionStatus status={selected.sub.status} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{ts.expiresLabel}</p>
                  <p className="text-foreground">
                    {selected.sub.expiresAt ? new Date(selected.sub.expiresAt).toLocaleDateString(locale) : ts.never}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{ts.colCycle}</p>
                  <p className="text-foreground">
                    {selected.sub.billingCycle === 'MONTHLY'
                      ? copy.monthly
                      : selected.sub.billingCycle === 'YEARLY'
                        ? copy.yearly
                        : '—'}
                  </p>
                </div>
              </div>

              <Separator className="bg-muted" />

              {/* Override */}
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <p className="text-xs text-amber-800 dark:text-amber-400">{ts.overrideWarning}</p>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-32 flex-1 space-y-1.5">
                  <Label htmlFor="business-plan" className="text-foreground text-sm">
                    {ts.newPlanLabel}
                  </Label>
                  <Select value={newPlan} onValueChange={setNewPlan} disabled={isChangingPlan}>
                    <SelectTrigger id="business-plan" className="w-full bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FREE" className="text-foreground">
                        Free
                      </SelectItem>
                      <SelectItem value="BASIC" className="text-foreground">
                        Basic
                      </SelectItem>
                      <SelectItem value="PRO" className="text-foreground">
                        Pro
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newPlan !== 'FREE' && (
                  <div className="min-w-32 flex-1 space-y-1.5">
                    <Label htmlFor="business-cycle" className="text-foreground text-sm">
                      {ts.colCycle}
                    </Label>
                    <Select value={newCycle} onValueChange={setNewCycle} disabled={isChangingPlan}>
                      <SelectTrigger id="business-cycle" className="w-full bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY" className="text-foreground">
                          {copy.monthly}
                        </SelectItem>
                        <SelectItem value="YEARLY" className="text-foreground">
                          {copy.yearly}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button
                  onClick={handleChangePlan}
                  disabled={!newPlan || isChangingPlan}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isChangingPlan && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {isChangingPlan ? ts.changingPlan : ts.changePlan}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-4 text-center" role="alert">
              <p className="text-sm text-muted-foreground">{detailError || ts.loadError}</p>
              <Button variant="outline" disabled={!selected} onClick={() => selected && openDetail(selected)}>
                {t.common.retry}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
