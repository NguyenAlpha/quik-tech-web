'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Check, ArrowUpCircle, ArrowDownCircle, AlertTriangle, Receipt,
  Loader2, Copy, CheckCheck,
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { PageSkeleton } from '@/components/page-skeleton'
import { PageError } from '@/components/page-error'
import { useAuth } from '@/lib/auth-context'
import { useLanguage } from '@/lib/language-context'
import {
  getBusinessSubscription, requestUpgrade, getInvoicesPage,
  scheduleDowngrade, cancelScheduledDowngrade,
  cancelInvoice, getSubscriptionBankInfo,
} from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type {
  BusinessSubscription, SubscriptionInvoice, BankTransferInfo,
} from '@/lib/types'

const PLAN_PRICES: Record<string, Record<string, number>> = {
  BASIC: { MONTHLY: 199000, YEARLY: 1990000 },
  PRO:   { MONTHLY: 499000, YEARLY: 4990000 },
}

const planStyles: Record<string, { className: string }> = {
  FREE:  { className: 'bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300' },
  BASIC: { className: 'bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-950 dark:text-blue-400' },
  PRO:   { className: 'bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-950 dark:text-amber-400' },
}

const invoiceStatusStyles: Record<string, { className: string }> = {
  PENDING: { className: 'bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-950 dark:text-amber-400' },
  PAID:    { className: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400' },
  FAILED:  { className: 'bg-red-50 text-red-700 hover:bg-red-50 dark:bg-red-950 dark:text-red-400' },
}

export default function SubscriptionPage() {
  const { businessId, memberships } = useAuth()
  const { language, t } = useLanguage()
  const ts = t.subscription
  const planLabels: Record<string, string> = {
    FREE: ts.planFree,
    BASIC: ts.planBasic,
    PRO: ts.planPro,
  }
  const statusLabels: Record<string, string> = {
    PENDING: ts.statusPending,
    PAID: ts.statusPaid,
    FAILED: ts.statusFailed,
  }
  const plans = [
    { id: 'FREE', name: ts.planFree, description: ts.freePlanDescription, features: ts.freePlanFeatures },
    { id: 'BASIC', name: ts.planBasic, description: ts.basicPlanDescription, features: ts.basicPlanFeatures, popular: true },
    { id: 'PRO', name: ts.planPro, description: ts.proPlanDescription, features: ts.proPlanFeatures },
  ]
  const locale = language === 'vi' ? 'vi-VN' : 'en-US'

  const [subscription, setSubscription] = useState<BusinessSubscription | null>(null)
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([])
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)

  // Plan selection modal
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)
  const [upgradeForm, setUpgradeForm] = useState({ plan: 'BASIC', billingCycle: 'MONTHLY' })
  const [upgradeLoading, setUpgradeLoading] = useState(false)

  // Checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [checkoutInvoice, setCheckoutInvoice] = useState<SubscriptionInvoice | null>(null)
  const [checkoutBankInfo, setCheckoutBankInfo] = useState<BankTransferInfo | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Downgrade modals
  const [isDowngradeOpen, setIsDowngradeOpen] = useState(false)
  const [downgradeForm, setDowngradeForm] = useState({ plan: 'FREE' })
  const [downgradeLoading, setDowngradeLoading] = useState(false)
  const [isCancelDowngradeOpen, setIsCancelDowngradeOpen] = useState(false)
  const [cancelDowngradeLoading, setCancelDowngradeLoading] = useState(false)

  const isOwner = memberships.find(m => m.businessId === businessId)?.stores[0]?.role === 'ROLE_OWNER'

  const upgradeablePlans = subscription?.plan === 'FREE'
    ? ['BASIC', 'PRO']
    : subscription?.plan === 'BASIC'
    ? ['PRO']
    : []

  const downgradeablePlans = subscription?.plan === 'PRO'
    ? ['BASIC', 'FREE']
    : subscription?.plan === 'BASIC'
    ? ['FREE']
    : []

  const pendingInvoice = invoices.find(inv => inv.status === 'PENDING') ?? null

  const init = async () => {
    if (!businessId) { setIsPageLoading(false); return }
    setIsPageLoading(true)
    setPageError(null)
    try {
      const [sub, inv] = await Promise.all([
        getBusinessSubscription(businessId),
        getInvoicesPage(businessId, { page: 0, size: 10 }),
      ])
      setSubscription(sub)
      setInvoices(inv.content)
    } catch (err) {
      setPageError(err instanceof Error ? err.message : ts.loadError)
    } finally {
      setIsPageLoading(false)
    }
  }

  useEffect(() => { init() }, [businessId])

  const openUpgrade = (plan: string) => {
    setUpgradeForm({ plan, billingCycle })
    setIsUpgradeOpen(true)
  }

  const handleUpgrade = async () => {
    if (!businessId) return
    setUpgradeLoading(true)
    try {
      const result = await requestUpgrade(businessId, upgradeForm.plan, upgradeForm.billingCycle)
      const [sub, inv] = await Promise.all([
        getBusinessSubscription(businessId),
        getInvoicesPage(businessId, { page: 0, size: 10 }),
      ])
      setSubscription(sub)
      setInvoices(inv.content)
      setIsUpgradeOpen(false)
      setCheckoutInvoice(result.invoice)
      setCheckoutBankInfo(result.bankInfo)
      setIsCheckoutOpen(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts.upgradeError)
    } finally {
      setUpgradeLoading(false)
    }
  }

  const openCheckoutFromBanner = async () => {
    if (!businessId || !pendingInvoice) return
    try {
      const bankInfo = await getSubscriptionBankInfo(businessId)
      setCheckoutInvoice(pendingInvoice)
      setCheckoutBankInfo(bankInfo)
      setIsCheckoutOpen(true)
    } catch {
      toast.error(ts.loadBankInfoError)
    }
  }

  const handleCancelInvoice = async () => {
    if (!businessId || !checkoutInvoice) return
    setCancelLoading(true)
    try {
      await cancelInvoice(businessId, checkoutInvoice.id)
      setInvoices(prev => prev.filter(inv => inv.id !== checkoutInvoice.id))
      setIsCheckoutOpen(false)
      setCheckoutInvoice(null)
      setCheckoutBankInfo(null)
      toast.success(ts.cancelPaymentSuccess)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts.cancelPaymentError)
    } finally {
      setCancelLoading(false)
    }
  }

  const handlePaid = () => {
    setIsCheckoutOpen(false)
    setCheckoutInvoice(null)
    setCheckoutBankInfo(null)
    toast.success(ts.paymentSubmittedSuccess)
  }

  const copyRef = () => {
    if (!checkoutInvoice?.bankTransferRef) return
    navigator.clipboard.writeText(checkoutInvoice.bankTransferRef)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openDowngrade = (plan: string) => {
    setDowngradeForm({ plan })
    setIsDowngradeOpen(true)
  }

  const handleDowngrade = async () => {
    if (!businessId) return
    setDowngradeLoading(true)
    try {
      const updated = await scheduleDowngrade(businessId, downgradeForm.plan)
      setSubscription(updated)
      setIsDowngradeOpen(false)
      toast.success(ts.downgradeSuccess)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts.downgradeError)
    } finally {
      setDowngradeLoading(false)
    }
  }

  const handleCancelDowngrade = async () => {
    if (!businessId) return
    setCancelDowngradeLoading(true)
    try {
      const updated = await cancelScheduledDowngrade(businessId)
      setSubscription(updated)
      setIsCancelDowngradeOpen(false)
      toast.success(ts.cancelDowngradeSuccess)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts.cancelDowngradeError)
    } finally {
      setCancelDowngradeLoading(false)
    }
  }

  if (isPageLoading) return <PageSkeleton />
  if (pageError) return <PageError message={pageError} onRetry={init} />

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{ts.title}</h1>
          <p className="text-base text-muted-foreground">{ts.subtitle}</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            size="sm"
            variant={billingCycle === 'MONTHLY' ? 'default' : 'ghost'}
            className="h-8"
            onClick={() => setBillingCycle('MONTHLY')}
          >
            {ts.monthly}
          </Button>
          <Button
            size="sm"
            variant={billingCycle === 'YEARLY' ? 'default' : 'ghost'}
            className="h-8"
            onClick={() => setBillingCycle('YEARLY')}
          >
            {ts.yearly}
          </Button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {plans.map(plan => {
          const isCurrent = subscription?.plan === plan.id
          const canUpgrade = isOwner && upgradeablePlans.includes(plan.id) && !pendingInvoice
          const canDowngrade = isOwner && downgradeablePlans.includes(plan.id) && !subscription?.pendingPlan

          return (
            <Card
              key={plan.id}
              className={[
                'relative flex flex-col',
                isCurrent ? 'ring-2 ring-primary' : '',
                plan.popular && !isCurrent ? 'border-blue-300 dark:border-blue-700' : '',
              ].filter(Boolean).join(' ')}
            >
              {(isCurrent || plan.popular) && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <Badge className={plan.popular && !isCurrent ? 'bg-blue-600 text-white hover:bg-blue-600' : ''}>
                    {isCurrent ? ts.currentPlan : ts.mostPopular}
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-4 pt-7">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  {plan.id === 'FREE' ? (
                    <span className="text-3xl font-bold">{ts.planFree}</span>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        {formatCurrency(PLAN_PRICES[plan.id][billingCycle])}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        /{billingCycle === 'MONTHLY' ? ts.month : ts.year}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-6">
                <ul className="space-y-2.5">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 shrink-0 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  {isCurrent ? (
                    <Button className="w-full" variant="outline" disabled>{ts.currentPlan}</Button>
                  ) : canUpgrade ? (
                    <Button className="w-full gap-2" onClick={() => openUpgrade(plan.id)}>
                      <ArrowUpCircle className="size-4" />
                      {ts.upgradeBtn}
                    </Button>
                  ) : canDowngrade ? (
                    <Button className="w-full gap-2" variant="outline" onClick={() => openDowngrade(plan.id)}>
                      <ArrowDownCircle className="size-4" />
                      {ts.downgradeBtn}
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Pending downgrade banner */}
      {subscription?.pendingPlan && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
          <ArrowDownCircle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
          <div className="flex-1 space-y-0.5">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">{ts.pendingDowngradeTitle}</p>
            <p className="text-xs text-red-700 dark:text-red-400">
              {ts.pendingDowngradeDesc
                .replace('{plan}', planLabels[subscription.pendingPlan] ?? subscription.pendingPlan)
                .replace('{date}', subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString(locale) : '—')}
            </p>
          </div>
          {isOwner && (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
              onClick={() => setIsCancelDowngradeOpen(true)}
            >
              {ts.cancelDowngradeBtn}
            </Button>
          )}
        </div>
      )}

      {/* Pending invoice banner */}
      {pendingInvoice && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="flex-1 space-y-0.5">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {ts.pendingPaymentTitle}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {ts.transferReference}: <span className="font-mono font-semibold">{pendingInvoice.bankTransferRef}</span> — {ts.pendingPaymentDesc}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/50"
            onClick={openCheckoutFromBanner}
          >
            {ts.viewDetails}
          </Button>
        </div>
      )}

      {/* Invoice history */}
      {invoices.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">{ts.invoicesTitle}</p>
          </div>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">{ts.colPlan}</TableHead>
                  <TableHead className="text-xs">{ts.colCycle}</TableHead>
                  <TableHead className="text-xs">{ts.colAmount}</TableHead>
                  <TableHead className="text-xs">{ts.colStatus}</TableHead>
                  <TableHead className="text-xs">{ts.colDate}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="py-2">
                      <Badge variant="secondary" className={`text-xs ${planStyles[inv.plan]?.className}`}>
                        {planLabels[inv.plan] ?? inv.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 text-sm text-muted-foreground">
                      {inv.billingCycle === 'MONTHLY' ? ts.monthly.split(' ')[0] : ts.yearly.split(' ')[0]}
                    </TableCell>
                    <TableCell className="py-2 text-sm font-medium">{formatCurrency(inv.amount)}</TableCell>
                    <TableCell className="py-2">
                      <Badge variant="secondary" className={`text-xs ${invoiceStatusStyles[inv.status]?.className}`}>
                        {statusLabels[inv.status] ?? inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">
                      {new Date(inv.createdAt).toLocaleDateString(locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ── Plan selection modal ── */}
      <Dialog open={isUpgradeOpen} onOpenChange={open => !open && setIsUpgradeOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{ts.upgradeTitle}</DialogTitle>
            <DialogDescription>{ts.upgradeDesc}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <Label>{ts.planLabel}</Label>
              <Select value={upgradeForm.plan} onValueChange={v => setUpgradeForm(p => ({ ...p, plan: v }))}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {upgradeablePlans.includes('BASIC') && (
                    <SelectItem value="BASIC">{ts.planBasic} — {formatCurrency(PLAN_PRICES.BASIC.MONTHLY)}/{ts.month}</SelectItem>
                  )}
                  {upgradeablePlans.includes('PRO') && (
                    <SelectItem value="PRO">{ts.planPro} — {formatCurrency(PLAN_PRICES.PRO.MONTHLY)}/{ts.month}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{ts.cycleLabel}</Label>
              <Select value={upgradeForm.billingCycle} onValueChange={v => setUpgradeForm(p => ({ ...p, billingCycle: v }))}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">{ts.monthly}</SelectItem>
                  <SelectItem value="YEARLY">{ts.yearly}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(PLAN_PRICES[upgradeForm.plan]?.[upgradeForm.billingCycle] ?? 0) > 0 && (
              <div className="rounded-lg bg-muted px-4 py-3">
                <p className="text-xs text-muted-foreground">{ts.total}</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(PLAN_PRICES[upgradeForm.plan][upgradeForm.billingCycle])}
                </p>
                <p className="text-xs text-muted-foreground">
                  {upgradeForm.billingCycle === 'YEARLY' ? ts.perYear : ts.perMonth}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpgradeOpen(false)} disabled={upgradeLoading}>
              {ts.cancel}
            </Button>
            <Button onClick={handleUpgrade} disabled={upgradeLoading} className="gap-2">
              {upgradeLoading
                ? <><Loader2 className="size-4 animate-spin" />{ts.processing}</>
                : ts.continueToPayment}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Checkout modal ── */}
      <Dialog open={isCheckoutOpen} onOpenChange={open => { if (!open) { setIsCheckoutOpen(false); setCheckoutInvoice(null); setCheckoutBankInfo(null) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{ts.checkoutTitle}</DialogTitle>
            <DialogDescription>
              {ts.checkoutDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Amount */}
            <div className="rounded-lg bg-muted px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground">{ts.amountToTransfer}</p>
              <p className="text-2xl font-bold">{formatCurrency(checkoutInvoice?.amount ?? 0)}</p>
              <p className="text-xs text-muted-foreground">
                {planLabels[checkoutInvoice?.plan ?? '']} —{' '}
                {checkoutInvoice?.billingCycle === 'MONTHLY' ? ts.monthly : ts.yearly}
              </p>
            </div>

            {/* QR code */}
            <div className="flex justify-center">
              <div className="relative size-48 overflow-hidden rounded-xl border">
                <Image src="/qr.png" alt={ts.transferQrAlt} fill className="object-cover" />
              </div>
            </div>

            {/* Transfer reference — most important */}
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 px-4 py-3">
              <p className="mb-1 text-xs text-muted-foreground">{ts.transferReference}</p>
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-lg font-bold tracking-wider">
                  {checkoutInvoice?.bankTransferRef ?? '—'}
                </p>
                <Button size="sm" variant="outline" className="shrink-0 gap-1" onClick={copyRef}>
                  {copied ? <CheckCheck className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  {copied ? ts.copied : ts.copy}
                </Button>
              </div>
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                ⚠ {ts.transferReferenceNote}
              </p>
            </div>

            {/* Bank info */}
            {checkoutBankInfo && (
              <div className="divide-y rounded-lg border">
                {[
                  { label: ts.bankName,      value: checkoutBankInfo.bankName },
                  { label: ts.accountNumber, value: checkoutBankInfo.accountNumber },
                  { label: ts.accountHolder, value: checkoutBankInfo.accountHolder },
                  { label: ts.branch,        value: checkoutBankInfo.branch },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium">{value || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-600"
              onClick={handleCancelInvoice}
              disabled={cancelLoading}
            >
              {cancelLoading && <Loader2 className="size-4 animate-spin" />}
              {ts.cancelPayment}
            </Button>
            <Button onClick={handlePaid} className="gap-2">
              <Check className="size-4" />
              {ts.transferred}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Downgrade modal ── */}
      <Dialog open={isDowngradeOpen} onOpenChange={open => !open && setIsDowngradeOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{ts.downgradeTitle}</DialogTitle>
            <DialogDescription>{ts.downgradeDesc}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <Label>{ts.downgradePlanLabel}</Label>
              <Select value={downgradeForm.plan} onValueChange={v => setDowngradeForm({ plan: v })}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {downgradeablePlans.includes('BASIC') && <SelectItem value="BASIC">{ts.planBasic}</SelectItem>}
                  {downgradeablePlans.includes('FREE') && <SelectItem value="FREE">{ts.downgradeFree}</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              {ts.downgradeWarning}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDowngradeOpen(false)} disabled={downgradeLoading}>{ts.cancel}</Button>
            <Button variant="destructive" onClick={handleDowngrade} disabled={downgradeLoading} className="gap-2">
              {downgradeLoading
                ? <><Loader2 className="size-4 animate-spin" />{ts.downgrading}</>
                : <><Check className="size-4" />{ts.confirmDowngrade}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel downgrade modal ── */}
      <Dialog open={isCancelDowngradeOpen} onOpenChange={open => !open && setIsCancelDowngradeOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{ts.cancelDowngradeTitle}</DialogTitle>
            <DialogDescription>{ts.cancelDowngradeDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDowngradeOpen(false)} disabled={cancelDowngradeLoading}>
              {ts.cancel}
            </Button>
            <Button onClick={handleCancelDowngrade} disabled={cancelDowngradeLoading} className="gap-2">
              {cancelDowngradeLoading
                ? <><Loader2 className="size-4 animate-spin" />{ts.cancellingDowngrade}</>
                : <><Check className="size-4" />{ts.confirmCancelDowngrade}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
