'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { AdminTableState } from '@/components/admin-table-state'
import { AdminPagination } from '@/components/admin-pagination'
import { AdminPlanBadge } from '@/components/admin-subscription-badges'
import { PaymentBankDetails } from '@/components/payment-bank-details'
import { usePaymentAccountCopy } from '@/lib/payment-account-copy'
import { useLanguage } from '@/lib/language-context'
import { useAdminCopy } from '@/lib/admin-copy'
import { formatCurrency } from '@/lib/utils'
import type { SubscriptionInvoice } from '@/lib/types'

export function AdminInvoiceHistory({
  invoices,
  loading,
  error,
  page,
  totalPages,
  onPageChange,
  onRetry
}: {
  invoices: SubscriptionInvoice[]
  loading: boolean
  error: string | null
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onRetry: () => void
}) {
  const copy = useAdminCopy()
  const bankCopy = usePaymentAccountCopy()
  const { t, language } = useLanguage()
  const labels = { PENDING: copy.pending, PAID: copy.paid, FAILED: copy.failed }
  const colors = {
    PENDING: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    PAID: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    FAILED: 'bg-muted text-muted-foreground'
  }
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>{copy.businesses}</TableHead>
            <TableHead>{t.subscription.colPlan}</TableHead>
            <TableHead>{t.subscription.currentStatusLabel}</TableHead>
            <TableHead className="text-right">
              {t.subscription.colAmount}
            </TableHead>
            <TableHead>{copy.created}</TableHead>
            <TableHead>{copy.note}</TableHead>
            <TableHead>{bankCopy.title}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading || error || !invoices.length ? (
            <AdminTableState
              columns={8}
              loading={loading}
              error={error}
              emptyMessage={copy.noInvoices}
              onRetry={onRetry}
            />
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-mono">#{invoice.id}</TableCell>
                <TableCell>
                  <Link
                    className="font-medium text-primary hover:underline"
                    href={`/admin/businesses/${invoice.businessId}`}
                  >
                    #{invoice.businessId}
                  </Link>
                </TableCell>
                <TableCell>
                  <AdminPlanBadge plan={invoice.plan} />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {invoice.billingCycle === 'MONTHLY'
                      ? copy.monthly
                      : copy.yearly}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={colors[invoice.status]}>
                    {labels[invoice.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(invoice.amount)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {new Date(invoice.createdAt).toLocaleDateString(
                    language === 'vi' ? 'vi-VN' : 'en-US'
                  )}
                </TableCell>
                <TableCell className="min-w-48 max-w-80 whitespace-normal break-words">
                  {invoice.adminNote || '—'}
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                  {invoice.bankTransferRef}
                  </p>
                </TableCell>
                <TableCell className="min-w-64 max-w-96 whitespace-normal">
                  <details><summary className="cursor-pointer text-sm text-primary">{bankCopy.snapshotTitle}</summary><div className="mt-3"><PaymentBankDetails info={invoice.bankInfo} /></div></details>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <AdminPagination
        page={page}
        totalPages={totalPages}
        disabled={loading || !!error}
        onPageChange={onPageChange}
      />
    </div>
  )
}
