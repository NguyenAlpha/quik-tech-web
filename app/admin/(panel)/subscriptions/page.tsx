'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Check, X, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useLanguage } from '@/lib/language-context'
import { errorMessage } from '@/lib/api-error'
import {
  adminGetPendingInvoices, adminConfirmInvoice, adminRejectInvoice,
  adminGetBusinesses, adminGetSubscription, adminChangePlan,
} from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { SubscriptionInvoice, Business, BusinessSubscription } from '@/lib/types'

const planStyles: Record<string, { label: string; className: string }> = {
  FREE:  { label: 'Free',  className: 'bg-muted text-foreground' },
  BASIC: { label: 'Basic', className: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' },
  PRO:   { label: 'Pro',   className: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' },
}

const statusColor: Record<string, string> = {
  ACTIVE:    'text-emerald-700 dark:text-emerald-400',
  EXPIRED:   'text-destructive',
  CANCELLED: 'text-muted-foreground',
}

export default function AdminSubscriptionsPage() {
  const { t } = useLanguage()
  const ts = t.subscription

  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const [confirmTarget, setConfirmTarget] = useState<SubscriptionInvoice | null>(null)
  const [rejectTarget, setRejectTarget] = useState<SubscriptionInvoice | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [isActioning, setIsActioning] = useState(false)

  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [currentSub, setCurrentSub] = useState<BusinessSubscription | null>(null)
  const [isSubLoading, setIsSubLoading] = useState(false)
  const [newPlan, setNewPlan] = useState('')
  const [newCycle, setNewCycle] = useState('MONTHLY')
  const [isChangingPlan, setIsChangingPlan] = useState(false)

  useEffect(() => { loadInvoices() }, [page])
  useEffect(() => { adminGetBusinesses().then(setBusinesses).catch(() => {}) }, [])
  useEffect(() => {
    if (!selectedBusinessId) { setCurrentSub(null); setNewPlan(''); return }
    setIsSubLoading(true)
    setCurrentSub(null)
    adminGetSubscription(Number(selectedBusinessId))
      .then(sub => { setCurrentSub(sub); setNewPlan(sub.plan); setNewCycle(sub.billingCycle ?? 'MONTHLY') })
      .catch(() => {})
      .finally(() => setIsSubLoading(false))
  }, [selectedBusinessId])

  const loadInvoices = async () => {
    setIsLoading(true)
    try {
      const result = await adminGetPendingInvoices({ page, size: 20 })
      setInvoices(result.content)
      setTotalPages(result.totalPages)
    } catch (err) {
      toast.error(errorMessage(err, t, ts.loadError))
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!confirmTarget) return
    setIsActioning(true)
    try {
      await adminConfirmInvoice(confirmTarget.id, adminNote.trim() || undefined)
      setInvoices(prev => prev.filter(inv => inv.id !== confirmTarget.id))
      setConfirmTarget(null)
      setAdminNote('')
      toast.success(ts.confirmSuccess)
    } catch (err) {
      toast.error(errorMessage(err, t, ts.confirmError))
    } finally {
      setIsActioning(false)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget || !adminNote.trim()) return
    setIsActioning(true)
    try {
      await adminRejectInvoice(rejectTarget.id, adminNote.trim())
      setInvoices(prev => prev.filter(inv => inv.id !== rejectTarget.id))
      setRejectTarget(null)
      setAdminNote('')
      toast.success(ts.rejectSuccess)
    } catch (err) {
      toast.error(errorMessage(err, t, ts.rejectError))
    } finally {
      setIsActioning(false)
    }
  }

  const handleChangePlan = async () => {
    if (!selectedBusinessId || !newPlan) return
    setIsChangingPlan(true)
    try {
      // billingCycle chỉ gửi với gói trả phí — backend từ chối khi thiếu (400)
      const updated = await adminChangePlan(Number(selectedBusinessId), newPlan, newPlan === 'FREE' ? undefined : newCycle)
      setCurrentSub(updated)
      toast.success(ts.changePlanSuccess)
    } catch (err) {
      toast.error(errorMessage(err, t, ts.changePlanError))
    } finally {
      setIsChangingPlan(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{ts.adminPendingTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">{ts.adminPendingSubtitle}</p>
      </div>

      {/* Pending invoices table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">{ts.colBusiness}</TableHead>
              <TableHead className="text-muted-foreground">{ts.colPlan}</TableHead>
              <TableHead className="text-muted-foreground">{ts.colCycle}</TableHead>
              <TableHead className="text-muted-foreground">{ts.colAmount}</TableHead>
              <TableHead className="text-muted-foreground">{ts.colTransferRef}</TableHead>
              <TableHead className="text-muted-foreground">{ts.colCreated}</TableHead>
              <TableHead className="text-right text-muted-foreground">{ts.colActions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Check className="size-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{ts.adminNoPending}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : invoices.map(inv => (
              <TableRow key={inv.id} className="border-border hover:bg-muted/50">
                <TableCell className="font-medium text-foreground">#{inv.businessId}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={planStyles[inv.plan]?.className}>
                    {planStyles[inv.plan]?.label ?? inv.plan}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {inv.billingCycle === 'MONTHLY' ? ts.monthly.split(' ')[0] : ts.yearly.split(' ')[0]}
                </TableCell>
                <TableCell className="font-medium text-foreground">{formatCurrency(inv.amount)}</TableCell>
                <TableCell className="max-w-48">
                  {inv.bankTransferRef ? (
                    <span className="block truncate font-mono text-sm text-foreground">{inv.bankTransferRef}</span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-amber-500">
                      <AlertCircle className="size-3.5" />
                      {ts.refNotSubmitted}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(inv.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1.5 border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-900/30"
                      onClick={() => { setConfirmTarget(inv); setAdminNote('') }}
                    >
                      <Check className="size-3.5" />
                      {ts.confirmBtn}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1.5 border-red-700 text-destructive hover:bg-red-900/30"
                      onClick={() => { setRejectTarget(inv); setAdminNote('') }}
                    >
                      <X className="size-3.5" />
                      {ts.rejectBtn}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0 || isLoading}
                className="border-border text-foreground hover:bg-muted">Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1 || isLoading}
                className="border-border text-foreground hover:bg-muted">Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Override Plan */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">{ts.adminOverrideTitle}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{ts.adminOverrideSubtitle}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">{ts.selectBusiness}</Label>
          <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
            <SelectTrigger className="w-full sm:max-w-sm bg-muted border-border text-foreground">
              <SelectValue placeholder={ts.selectBusiness} />
            </SelectTrigger>
            <SelectContent className="bg-muted border-border">
              {businesses.map(b => (
                <SelectItem key={b.id} value={String(b.id)} className="text-foreground">
                  #{b.id} — {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedBusinessId && (
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            {isSubLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />Loading...
              </div>
            ) : currentSub ? (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{ts.currentPlanLabel}</p>
                  <Badge variant="secondary" className={planStyles[currentSub.plan]?.className}>
                    {planStyles[currentSub.plan]?.label ?? currentSub.plan}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{ts.currentStatusLabel}</p>
                  <p className={`text-sm font-medium ${statusColor[currentSub.status] ?? ''}`}>
                    {currentSub.status}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{ts.expiresLabel}</p>
                  <p className="text-sm text-foreground">
                    {currentSub.expiresAt ? new Date(currentSub.expiresAt).toLocaleDateString() : ts.never}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {!selectedBusinessId && (
          <p className="text-sm text-muted-foreground">{ts.noBusinessSelected}</p>
        )}

        <Separator className="bg-muted" />

        <div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-800 dark:text-amber-400">{ts.overrideWarning}</p>
        </div>

        <div className="flex items-end gap-3">
          <div className="w-48 space-y-2">
            <Label className="text-foreground">{ts.newPlanLabel}</Label>
            <Select value={newPlan} onValueChange={setNewPlan} disabled={!selectedBusinessId || isSubLoading}>
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue placeholder={ts.newPlanLabel} />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                <SelectItem value="FREE" className="text-foreground">Free</SelectItem>
                <SelectItem value="BASIC" className="text-foreground">Basic</SelectItem>
                <SelectItem value="PRO" className="text-foreground">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {newPlan !== 'FREE' && (
            <div className="w-48 space-y-2">
              <Label className="text-foreground">{ts.colCycle}</Label>
              <Select value={newCycle} onValueChange={setNewCycle} disabled={!selectedBusinessId || isSubLoading}>
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  <SelectItem value="MONTHLY" className="text-foreground">{ts.monthly}</SelectItem>
                  <SelectItem value="YEARLY" className="text-foreground">{ts.yearly}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            onClick={handleChangePlan}
            disabled={!selectedBusinessId || !newPlan || isChangingPlan || isSubLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isChangingPlan && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isChangingPlan ? ts.changingPlan : ts.changePlan}
          </Button>
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmTarget} onOpenChange={open => !open && setConfirmTarget(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{ts.confirmTitle}</DialogTitle>
            <DialogDescription className="text-muted-foreground">{ts.confirmDesc}</DialogDescription>
          </DialogHeader>
          {confirmTarget && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">{ts.colPlan}</p>
                  <p className="font-medium">{planStyles[confirmTarget.plan]?.label ?? confirmTarget.plan}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">{ts.colAmount}</p>
                  <p className="font-medium">{formatCurrency(confirmTarget.amount)}</p>
                </div>
                {confirmTarget.bankTransferRef && (
                  <div className="col-span-2 space-y-0.5">
                    <p className="text-muted-foreground">{ts.colTransferRef}</p>
                    <p className="font-mono text-sm">{confirmTarget.bankTransferRef}</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">{ts.adminNoteOptional}</Label>
                <Textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder={ts.adminNotePlaceholder}
                  rows={2}
                  maxLength={500}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)} disabled={isActioning}
              className="border-border text-foreground hover:bg-muted">Cancel</Button>
            <Button onClick={handleConfirm} disabled={isActioning}
              className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
              {isActioning ? ts.confirming : <><Check className="size-4" />{ts.confirmPayment}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={open => !open && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{ts.rejectTitle}</DialogTitle>
            <DialogDescription className="text-muted-foreground">{ts.rejectDesc}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">{ts.rejectNoteLabel}</Label>
              <Textarea
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder={ts.rejectNotePlaceholder}
                rows={3}
                maxLength={500}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
              {!adminNote.trim() && (
                <p className="text-xs text-destructive">{ts.rejectNoteRequired}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)} disabled={isActioning}
              className="border-border text-foreground hover:bg-muted">Cancel</Button>
            <Button onClick={handleReject} disabled={isActioning || !adminNote.trim()}
              variant="destructive" className="gap-2">
              {isActioning ? ts.rejecting : <><X className="size-4" />{ts.rejectInvoice}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
