'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { toast } from 'sonner'
import { Check, X, AlertCircle, AlertTriangle, Loader2, RefreshCw, Building2, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useLanguage } from '@/lib/language-context'
import { PageHeader } from '@/components/page-header'
import { AdminTableState } from '@/components/admin-table-state'
import { AdminPagination } from '@/components/admin-pagination'
import { AdminPlanBadge, AdminSubscriptionStatus } from '@/components/admin-subscription-badges'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAdminCopy } from '@/lib/admin-copy'
import { errorMessage } from '@/lib/api-error'
import {
  adminGetPendingInvoices,
  adminConfirmInvoice,
  adminRejectInvoice,
  adminGetBusinesses,
  adminGetSubscription
} from '@/lib/api'
import { adminChangePlan } from '@/lib/admin-client'
import { AdminReasonField } from '@/components/admin-reason-field'
import { useAdminUrl } from '@/hooks/use-admin-url'
import { AdminInvoiceSearch } from '@/components/admin-invoice-search'
import { useAdminPending } from '@/components/admin-pending-provider'
import { formatCurrency } from '@/lib/utils'
import type { SubscriptionInvoice, Business, BusinessSubscription } from '@/lib/types'

function normalizeBusinessName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().trim()
}

function AdminSubscriptionsContent() {
  const { params, update, page } = useAdminUrl()
  const tab = ['override', 'history'].includes(params.get('tab') || '') ? params.get('tab')! : 'invoices'
  const invoiceRequest = useRef(0)
  const setPage = useCallback((value: number) => update({ page: value }), [update])
  const { count: pendingCount, refresh: refreshPending } = useAdminPending()
  const { t, language } = useLanguage()
  const copy = useAdminCopy()
  const locale = language === 'vi' ? 'vi-VN' : 'en-US'
  const ts = t.subscription

  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [businessError, setBusinessError] = useState<string | null>(null)
  const [subError, setSubError] = useState<string | null>(null)
  const [subReload, setSubReload] = useState(0)

  const [confirmTarget, setConfirmTarget] = useState<SubscriptionInvoice | null>(null)
  const [rejectTarget, setRejectTarget] = useState<SubscriptionInvoice | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [isActioning, setIsActioning] = useState(false)

  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isBusinessesLoading, setIsBusinessesLoading] = useState(true)
  const [businessPickerOpen, setBusinessPickerOpen] = useState(false)
  const selectedBusinessId = params.get('businessId') || ''
  const setSelectedBusinessId = (id: string) => update({ businessId: id })
  const [currentSub, setCurrentSub] = useState<BusinessSubscription | null>(null)
  const [isSubLoading, setIsSubLoading] = useState(false)
  const [newPlan, setNewPlan] = useState('')
  const [newCycle, setNewCycle] = useState('MONTHLY')
  const [isChangingPlan, setIsChangingPlan] = useState(false)
  const [reason, setReason] = useState('')

  const loadInvoices = useCallback(async () => {
    const request = ++invoiceRequest.current
    setIsLoading(true)
    setError(null)
    try {
      const result = await adminGetPendingInvoices({ page, size: 20 })
      if (request !== invoiceRequest.current) return
      if (result.content.length === 0 && page > 0) {
        setPage(Math.max(0, Math.min(page - 1, result.totalPages - 1)))
        return
      }
      setInvoices(result.content)
      setTotalPages(result.totalPages)
    } catch (err) {
      if (request === invoiceRequest.current) setError(errorMessage(err, t, ts.loadError))
    } finally {
      if (request === invoiceRequest.current) setIsLoading(false)
    }
  }, [page, t, ts.loadError, setPage])

  const loadBusinesses = useCallback(async () => {
    setIsBusinessesLoading(true)
    setBusinessError(null)
    try {
      setBusinesses(await adminGetBusinesses())
    } catch (err) {
      setBusinessError(errorMessage(err, t, ts.businessesLoadError))
    } finally {
      setIsBusinessesLoading(false)
    }
  }, [t, ts.businessesLoadError])

  useEffect(() => {
    if (tab === 'invoices') void loadInvoices()
    return () => { invoiceRequest.current++ }
  }, [loadInvoices, tab])
  useEffect(() => {
    void loadBusinesses()
  }, [loadBusinesses])
  useEffect(() => {
    let cancelled = false
    setCurrentSub(null)
    setReason('')
    setNewPlan('')
    setSubError(null)
    if (!selectedBusinessId) {
      setIsSubLoading(false)
      return
    }
    setIsSubLoading(true)
    adminGetSubscription(Number(selectedBusinessId))
      .then((sub) => {
        if (cancelled) return
        setCurrentSub(sub)
        setNewPlan(sub.plan)
        setNewCycle(sub.billingCycle ?? 'MONTHLY')
      })
      .catch((err) => {
        if (!cancelled) setSubError(errorMessage(err, t, ts.loadError))
      })
      .finally(() => {
        if (!cancelled) setIsSubLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedBusinessId, subReload, t, ts.loadError])

  const handleConfirm = async () => {
    if (!confirmTarget || isActioning) return
    setIsActioning(true)
    try {
      await adminConfirmInvoice(confirmTarget.id, adminNote.trim() || undefined)
      setInvoices((prev) => prev.filter((inv) => inv.id !== confirmTarget.id))
      setConfirmTarget(null)
      setAdminNote('')
      toast.success(ts.confirmSuccess)
      refreshPending()
      setSubReload(value => value + 1)
      void loadInvoices()
    } catch (err) {
      toast.error(errorMessage(err, t, ts.confirmError))
    } finally {
      setIsActioning(false)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget || !adminNote.trim() || isActioning) return
    setIsActioning(true)
    try {
      await adminRejectInvoice(rejectTarget.id, adminNote.trim())
      setInvoices((prev) => prev.filter((inv) => inv.id !== rejectTarget.id))
      setRejectTarget(null)
      setAdminNote('')
      toast.success(ts.rejectSuccess)
      refreshPending()
      void loadInvoices()
    } catch (err) {
      toast.error(errorMessage(err, t, ts.rejectError))
    } finally {
      setIsActioning(false)
    }
  }

  const handleChangePlan = async () => {
    if (!selectedBusinessId || !newPlan || !currentSub || isChangingPlan) return
    setIsChangingPlan(true)
    try {
      // billingCycle chỉ gửi với gói trả phí — backend từ chối khi thiếu (400)
      const updated = await adminChangePlan(
        Number(selectedBusinessId),
        newPlan,
        newPlan === 'FREE' ? undefined : newCycle,
        reason
      )
      setReason('')
      setCurrentSub(updated)
      toast.success(ts.changePlanSuccess)
    } catch (err) {
      toast.error(errorMessage(err, t, ts.changePlanError))
    } finally {
      setIsChangingPlan(false)
    }
  }

  const businessName = (id: number) => businesses.find((business) => business.id === id)?.name
  const reviewTarget = confirmTarget ?? rejectTarget
  const invoiceSummary = reviewTarget && (
    <dl className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
      <div className="col-span-2">
        <dt className="text-xs text-muted-foreground">{copy.businesses}</dt>
        <dd className="mt-1 break-words font-medium">
          {businessName(reviewTarget.businessId) || `#${reviewTarget.businessId}`}
        </dd>
        <dd className="text-xs text-muted-foreground">
          #{reviewTarget.businessId} · #{reviewTarget.id}
        </dd>
      </div>
      <div>
        <dt className="mb-1 text-xs text-muted-foreground">{ts.colPlan}</dt>
        <dd>
          <AdminPlanBadge plan={reviewTarget.plan} />
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">{ts.colCycle}</dt>
        <dd className="mt-1">{reviewTarget.billingCycle === 'MONTHLY' ? copy.monthly : copy.yearly}</dd>
      </div>
      <div className="col-span-2">
        <dt className="text-xs text-muted-foreground">{ts.colAmount}</dt>
        <dd className="mt-1 text-lg font-semibold tabular-nums">{formatCurrency(reviewTarget.amount)}</dd>
      </div>
      <div className="col-span-2">
        <dt className="text-xs text-muted-foreground">{ts.colTransferRef}</dt>
        <dd className="mt-1 break-all font-mono">{reviewTarget.bankTransferRef || ts.refNotSubmitted}</dd>
      </div>
    </dl>
  )

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={copy.subscriptions} subtitle={copy.subscriptionDescription} />
      <Tabs value={tab} onValueChange={tab => update({ tab, page: null })} className="gap-5">
        <TabsList className="h-auto max-w-full flex-wrap">
          <TabsTrigger value="invoices" className="px-3 py-2">
            {copy.invoiceQueue}{pendingCount !== null && <span className="ml-2 rounded-full bg-primary/10 px-2 text-xs text-primary">{pendingCount}</span>}
          </TabsTrigger>
          <TabsTrigger value="history" className="px-3 py-2">{copy.invoices}</TabsTrigger>
          <TabsTrigger value="override" className="px-3 py-2">
            {copy.overridePlan}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="invoices" className="min-w-0 space-y-4">
          {/* Pending invoices table */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold">{copy.invoiceQueue}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{copy.pendingDescription}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => { void loadInvoices(); refreshPending() }} disabled={isLoading}>
                <RefreshCw className="size-4" />
                {copy.refresh}
              </Button>
            </div>
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-5 text-muted-foreground">{copy.businesses}</TableHead>
                  <TableHead className="text-muted-foreground">{ts.colPlan}</TableHead>
                  <TableHead className="text-muted-foreground">{ts.colCycle}</TableHead>
                  <TableHead className="text-right text-muted-foreground">{ts.colAmount}</TableHead>
                  <TableHead className="text-muted-foreground">{ts.colTransferRef}</TableHead>
                  <TableHead className="text-muted-foreground">{ts.colCreated}</TableHead>
                  <TableHead className="text-right text-muted-foreground">{ts.colActions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || error || invoices.length === 0 ? (
                  <AdminTableState
                    columns={7}
                    loading={isLoading}
                    error={error}
                    emptyMessage={ts.adminNoPending}
                    onRetry={loadInvoices}
                  />
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id} className="border-border hover:bg-muted/50">
                      <TableCell className="py-4 pl-5">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-primary/10 p-2 text-primary">
                            <Building2 className="size-4" />
                          </div>
                          <div>
                            <p className="max-w-56 truncate font-medium" title={businessName(inv.businessId)}>
                              {businessName(inv.businessId) || `#${inv.businessId}`}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">#{inv.businessId}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <AdminPlanBadge plan={inv.plan} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {inv.billingCycle === 'MONTHLY' ? copy.monthly : copy.yearly}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(inv.amount)}
                      </TableCell>
                      <TableCell className="max-w-48">
                        {inv.bankTransferRef ? (
                          <span
                            title={inv.bankTransferRef}
                            className="block truncate font-mono text-xs text-muted-foreground"
                          >
                            {inv.bankTransferRef}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                            <AlertCircle className="size-3.5" />
                            {ts.refNotSubmitted}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(inv.createdAt).toLocaleDateString(locale)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => {
                              setConfirmTarget(inv)
                              setAdminNote('')
                            }}
                          >
                            <Check className="size-3.5" />
                            {ts.confirmBtn}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              setRejectTarget(inv)
                              setAdminNote('')
                            }}
                          >
                            <X className="size-3.5" />
                            {ts.rejectBtn}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <AdminPagination
              page={page}
              totalPages={totalPages}
              disabled={isLoading || !!error}
              onPageChange={setPage}
            />
          </div>
          {businessError && (
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground" role="alert">
              <span>{businessError}</span>
              <Button variant="outline" size="sm" onClick={loadBusinesses}>
                {t.common.retry}
              </Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="history" className="min-w-0"><AdminInvoiceSearch /></TabsContent>
        <TabsContent value="override" className="min-w-0">
          {/* Override Plan */}
          <div className="max-w-3xl space-y-6 rounded-xl border bg-card p-5 shadow-sm sm:p-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">{copy.overridePlan}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{copy.overrideDescription}</p>
            </div>
            {businessError && (
              <div className="space-y-2" role="alert">
                <p className="text-sm text-destructive">{businessError}</p>
                <Button variant="outline" size="sm" onClick={loadBusinesses}>
                  {t.common.retry}
                </Button>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="subscription-business">{copy.selectBusiness}</Label>
              <Popover open={businessPickerOpen} onOpenChange={setBusinessPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="subscription-business"
                    variant="outline"
                    role="combobox"
                    aria-expanded={businessPickerOpen}
                    disabled={isChangingPlan || isBusinessesLoading || !!businessError}
                    className="w-full justify-between bg-background font-normal"
                  >
                    <span className="truncate">
                      {isBusinessesLoading ? t.common.loading : selectedBusinessId
                        ? `${businessName(Number(selectedBusinessId)) || copy.selectBusiness} · #${selectedBusinessId}`
                        : copy.searchBusinessName}
                    </span>
                    <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command
                    defaultValue={selectedBusinessId}
                    filter={(_value, search, keywords) => normalizeBusinessName(keywords?.[0] || '').includes(normalizeBusinessName(search)) ? 1 : 0}
                  >
                    <CommandInput placeholder={copy.searchBusinessName} aria-label={copy.searchBusinessName} />
                    <CommandList>
                      <CommandEmpty>{copy.noMatchingBusinesses}</CommandEmpty>
                      <CommandGroup>
                        {businesses.map((b) => (
                          <CommandItem
                            key={b.id}
                            value={String(b.id)}
                            keywords={[b.name]}
                            onSelect={() => {
                              setSelectedBusinessId(String(b.id))
                              setBusinessPickerOpen(false)
                            }}
                          >
                            <Check className={selectedBusinessId === String(b.id) ? 'size-4' : 'size-4 opacity-0'} />
                            <span className="min-w-0 flex-1 break-words">{b.name}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">#{b.id}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedBusinessId && (
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                {isSubLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    {t.common.loading}
                  </div>
                ) : currentSub ? (
                  <div className="grid gap-4 text-sm sm:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{ts.currentPlanLabel}</p>
                      <AdminPlanBadge plan={currentSub.plan} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{ts.currentStatusLabel}</p>
                      <AdminSubscriptionStatus status={currentSub.status} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{ts.expiresLabel}</p>
                      <p className="text-sm text-foreground">
                        {currentSub.expiresAt ? new Date(currentSub.expiresAt).toLocaleDateString(locale) : ts.never}
                      </p>
                    </div>
                  </div>
                ) : subError ? (
                  <div className="space-y-3" role="alert">
                    <p className="text-sm text-destructive">{subError}</p>
                    <Button variant="outline" size="sm" onClick={() => setSubReload((value) => value + 1)}>
                      {t.common.retry}
                    </Button>
                  </div>
                ) : null}
              </div>
            )}

            {!selectedBusinessId && <p className="text-sm text-muted-foreground">{copy.noBusinessSelected}</p>}

            <Separator className="bg-muted" />

            <div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <p className="text-sm text-amber-800 dark:text-amber-400">{ts.overrideWarning}</p>
            </div>

            <AdminReasonField value={reason} onChange={setReason} disabled={!currentSub || isChangingPlan} />
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-36 flex-1 space-y-2">
                <Label htmlFor="subscription-plan">{ts.newPlanLabel}</Label>
                <Select
                  value={newPlan}
                  onValueChange={setNewPlan}
                  disabled={!currentSub || isSubLoading || isChangingPlan}
                >
                  <SelectTrigger id="subscription-plan" className="w-full bg-background">
                    <SelectValue placeholder={ts.newPlanLabel} />
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
                <div className="min-w-36 flex-1 space-y-2">
                  <Label htmlFor="subscription-cycle">{ts.colCycle}</Label>
                  <Select
                    value={newCycle}
                    onValueChange={setNewCycle}
                    disabled={!currentSub || isSubLoading || isChangingPlan}
                  >
                    <SelectTrigger id="subscription-cycle" className="w-full bg-background">
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
                disabled={!currentSub || !newPlan || isChangingPlan || isSubLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isChangingPlan && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isChangingPlan ? ts.changingPlan : ts.changePlan}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirm Dialog */}
      <Dialog
        open={!!confirmTarget}
        onOpenChange={(open) => {
          if (!open && !isActioning) setConfirmTarget(null)
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{ts.confirmTitle}</DialogTitle>
            <DialogDescription className="text-muted-foreground">{ts.confirmDesc}</DialogDescription>
          </DialogHeader>
          {confirmTarget && (
            <div className="grid gap-4 py-4">
              {invoiceSummary}
              <div className="space-y-2">
                <Label htmlFor="confirm-note">{ts.adminNoteOptional}</Label>
                <Textarea
                  id="confirm-note"
                  disabled={isActioning}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={ts.adminNotePlaceholder}
                  rows={2}
                  maxLength={500}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmTarget(null)}
              disabled={isActioning}
              className="border-border text-foreground hover:bg-muted"
            >
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isActioning}
              className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isActioning ? (
                ts.confirming
              ) : (
                <>
                  <Check className="size-4" />
                  {ts.confirmPayment}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open && !isActioning) setRejectTarget(null)
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{ts.rejectTitle}</DialogTitle>
            <DialogDescription className="text-muted-foreground">{ts.rejectDesc}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {invoiceSummary}
            <div className="space-y-2">
              <Label htmlFor="reject-note">{ts.rejectNoteLabel}</Label>
              <Textarea
                id="reject-note"
                disabled={isActioning}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={ts.rejectNotePlaceholder}
                rows={3}
                maxLength={500}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
              {!adminNote.trim() && <p className="text-xs text-destructive">{ts.rejectNoteRequired}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectTarget(null)}
              disabled={isActioning}
              className="border-border text-foreground hover:bg-muted"
            >
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleReject}
              disabled={isActioning || !adminNote.trim()}
              variant="destructive"
              className="gap-2"
            >
              {isActioning ? (
                ts.rejecting
              ) : (
                <>
                  <X className="size-4" />
                  {ts.rejectInvoice}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AdminSubscriptionsPage() {
  return <Suspense><AdminSubscriptionsContent /></Suspense>
}
