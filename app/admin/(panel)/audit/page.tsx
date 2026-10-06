'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { AdminTableState } from '@/components/admin-table-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { useAdminUrl } from '@/hooks/use-admin-url'
import { useLanguage } from '@/lib/language-context'
import { useAdminCopy } from '@/lib/admin-copy'
import { usePaymentAccountCopy } from '@/lib/payment-account-copy'
import { errorMessage } from '@/lib/api-error'
import {
  adminRequest,
  type AdminAuditEntry,
  type AdminAuditPage
} from '@/lib/admin-client'

function flatten(
  value: Record<string, unknown>,
  prefix = ''
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, item]) => {
      const path = prefix ? `${prefix}.${key}` : key
      return item && typeof item === 'object' && !Array.isArray(item)
        ? Object.entries(flatten(item as Record<string, unknown>, path))
        : [[path, item]]
    })
  )
}

function AuditContent() {
  const { params, update } = useAdminUrl()
  const copy = useAdminCopy()
  const bankCopy = usePaymentAccountCopy()
  const { t, language } = useLanguage()
  const action = params.get('action') || 'ALL'
  const businessId = params.get('businessId') || ''
  const actorId = params.get('actorId') || ''
  const beforeId = params.get('beforeId') || ''
  const [businessInput, setBusinessInput] = useState(businessId)
  const [actorInput, setActorInput] = useState(actorId)
  const [result, setResult] = useState<AdminAuditPage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)
  const [selected, setSelected] = useState<AdminAuditEntry | null>(null)
  const actions: Record<string, string> = {
    ADMIN_PLAN_CHANGED: copy.planChanged,
    ADMIN_INVOICE_CONFIRMED: copy.invoiceConfirmed,
    ADMIN_INVOICE_REJECTED: copy.invoiceRejected,
    ADMIN_USER_STATUS_CHANGED: copy.userStatusChanged,
    ADMIN_USER_DELETED: copy.userDeleted,
    ADMIN_PAYMENT_ACCOUNT_CREATED: bankCopy.accountCreated,
    ADMIN_PAYMENT_ACCOUNT_UPDATED: bankCopy.accountUpdated,
    ADMIN_PAYMENT_ACCOUNT_ACTIVATED: bankCopy.accountActivated,
    ADMIN_PAYMENT_ACCOUNT_ARCHIVED: bankCopy.accountArchived
  }
  useEffect(() => {
    setBusinessInput(businessId)
    setActorInput(actorId)
  }, [businessId, actorId])
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const query = new URLSearchParams({ size: '20' })
    if (businessId) query.set('businessId', businessId)
    if (actorId) query.set('actorId', actorId)
    if (beforeId) query.set('beforeId', beforeId)
    if (action !== 'ALL') query.set('action', action)
    adminRequest<AdminAuditPage>(`/api/admin/audit-logs?${query}`)
      .then((value) => {
        if (!cancelled) setResult(value)
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, t))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [action, businessId, actorId, beforeId, reload, t])

  const before = selected ? flatten(selected.before) : {}
  const after = selected ? flatten(selected.after) : {}
  const changed = [
    ...new Set([...Object.keys(before), ...Object.keys(after)])
  ].filter((key) => before[key] !== after[key])
  const fieldNames: Record<string, string> = {
    label: bankCopy.label, bankName: bankCopy.bankName, accountNumber: bankCopy.accountNumber,
    accountHolder: bankCopy.accountHolder, branch: bankCopy.branch, active: bankCopy.active,
    archived: bankCopy.archived, version: bankCopy.version, bankInfo: bankCopy.bankInfo,
    paymentAccountId: bankCopy.paymentAccountId,
    invoice: copy.invoices,
    subscription: copy.subscriptions,
    id: 'ID',
    businessId: copy.businessId,
    plan: t.subscription.colPlan,
    status: t.subscription.currentStatusLabel,
    billingCycle: t.subscription.colCycle,
    maxStores: copy.stores,
    maxStaff: copy.staff,
    maxProducts: copy.products,
    maxWarehouses: copy.warehouses,
    startedAt: copy.periodStart,
    expiresAt: t.subscription.expiresLabel,
    createdAt: copy.created,
    updatedAt: copy.updated,
    pendingPlan: copy.pendingPlan,
    pendingBillingCycle: copy.pendingCycle,
    amount: t.subscription.colAmount,
    bankTransferRef: t.subscription.colTransferRef,
    adminNote: copy.note,
    periodStart: copy.periodStart,
    periodEnd: copy.periodEnd,
    paidAt: copy.paidAt,
    confirmedAt: copy.confirmedAt,
    username: copy.usernameOrEmail,
    isActive: copy.active,
    deletedAt: copy.deletedAt
  }
  const display = (value: unknown) => {
    if (value === null || value === undefined) return '—'
    if (typeof value === 'boolean') return value ? copy.yes : copy.no
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value))
      return new Date(value).toLocaleString(
        language === 'vi' ? 'vi-VN' : 'en-US'
      )
    return String(value)
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title={copy.audit} subtitle={copy.auditDescription} />
      <form
        className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4"
        onSubmit={(event) => {
          event.preventDefault()
          update({
            businessId: businessInput,
            actorId: actorInput,
            beforeId: null
          })
        }}
      >
        <div className="min-w-48 flex-1 space-y-2">
          <Label htmlFor="audit-action">{copy.action}</Label>
          <Select
            value={action}
            onValueChange={(value) =>
              update({ action: value === 'ALL' ? null : value, beforeId: null })
            }
          >
            <SelectTrigger id="audit-action" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{copy.allActions}</SelectItem>
              {Object.entries(actions).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-32 flex-1 space-y-2">
          <Label htmlFor="audit-business">{copy.businessId}</Label>
          <Input
            id="audit-business"
            type="number"
            min={1}
            step={1}
            value={businessInput}
            onChange={(event) => setBusinessInput(event.target.value)}
          />
        </div>
        <div className="min-w-32 flex-1 space-y-2">
          <Label htmlFor="audit-actor">{copy.actorId}</Label>
          <Input
            id="audit-actor"
            type="number"
            min={1}
            step={1}
            value={actorInput}
            onChange={(event) => setActorInput(event.target.value)}
          />
        </div>
        <Button type="submit" variant="outline">
          {copy.search}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => setReload((value) => value + 1)}
        >
          <RefreshCw className="size-4" />
          {copy.refresh}
        </Button>
      </form>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>{copy.created}</TableHead>
              <TableHead>{copy.actor}</TableHead>
              <TableHead>{copy.action}</TableHead>
              <TableHead>{copy.target}</TableHead>
              <TableHead>{copy.reason}</TableHead>
              <TableHead>{copy.details}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading || error || !result?.content.length ? (
              <AdminTableState
                columns={6}
                loading={loading}
                error={error}
                emptyMessage={copy.noAudit}
                onRetry={() => setReload((value) => value + 1)}
              />
            ) : (
              result.content.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {display(entry.createdAt)}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{entry.actorName}</span>
                    <p className="text-xs text-muted-foreground">
                      #{entry.actorId}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {actions[entry.action] || entry.action}
                  </TableCell>
                  <TableCell>
                    <p>
                      {entry.entityType === 'USER'
                        ? copy.users
                        : entry.entityType === 'SUBSCRIPTION'
                          ? copy.subscriptions
                          : entry.entityType === 'PAYMENT_ACCOUNT'
                            ? bankCopy.title
                            : copy.invoices}{' '}
                      #{entry.entityId}
                    </p>
                    {entry.businessId && (
                      <Link
                        href={`/admin/businesses/${entry.businessId}`}
                        className="text-xs text-primary hover:underline"
                      >
                        {copy.businesses} #{entry.businessId}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="min-w-40 max-w-64 whitespace-normal break-words">
                    {entry.reason || '—'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelected(entry)}
                    >
                      {copy.viewDetails}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="flex justify-between gap-3 border-t p-4">
          <Button
            variant="outline"
            disabled={!beforeId || loading}
            onClick={() => update({ beforeId: null })}
          >
            {copy.latest}
          </Button>
          <Button
            variant="outline"
            disabled={!result?.nextCursor || loading || !!error}
            onClick={() => update({ beforeId: result?.nextCursor ?? null })}
          >
            {copy.older}
          </Button>
        </div>
      </div>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selected && actions[selected.action]}</DialogTitle>
            <DialogDescription>
              {selected &&
                `${selected.actorName} · ${display(selected.createdAt)} · #${selected.id}`}
            </DialogDescription>
          </DialogHeader>
          <p className="break-words rounded-lg border bg-muted/30 p-3 text-sm">
            {copy.reason}: {selected?.reason || copy.noReason}
          </p>
          <h3 className="font-medium">{copy.changes}</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy.field}</TableHead>
                <TableHead>{copy.before}</TableHead>
                <TableHead>{copy.after}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {changed.length ? (
                changed.map((key) => (
                  <TableRow key={key}>
                    <TableCell className="whitespace-normal">
                      {key
                        .split('.')
                        .map((part) => fieldNames[part] || part)
                        .join(' · ')}
                    </TableCell>
                    <TableCell className="max-w-64 whitespace-normal break-words text-muted-foreground">
                      {display(before[key])}
                    </TableCell>
                    <TableCell className="max-w-64 whitespace-normal break-words font-medium">
                      {display(after[key])}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3}>{copy.noChanges}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AdminAuditPage() {
  return (
    <Suspense>
      <AuditContent />
    </Suspense>
  )
}
