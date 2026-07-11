"use client"

import { useLanguage } from "@/lib/language-context"
import { formatCurrency } from "@/lib/utils"
import {
  MoreHorizontal,
  Eye,
  Trash2,
  ArrowUpDown,
  Receipt,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Payment } from "@/lib/types"

interface PaymentsTableProps {
  payments: Payment[]
  onSelect: (payment: Payment) => void
  onDelete: (payment: Payment) => void
}

const isIncome = (p: Payment) => p.supplierPublicId == null

interface PaymentActionsProps {
  payment: Payment
  onSelect: (payment: Payment) => void
  onDelete: (payment: Payment) => void
}

function PaymentActionsMenu({ payment, onSelect, onDelete }: PaymentActionsProps) {
  const { t } = useLanguage()
  const tp = t.payments
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(payment) }}>
          <Eye className="mr-2 size-4" />
          {tp.viewDetails}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={(e) => { e.stopPropagation(); onDelete(payment) }}>
          <Trash2 className="mr-2 size-4" />
          {t.common.delete}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function PaymentsTable({ payments, onSelect, onDelete }: PaymentsTableProps) {
  const { t } = useLanguage()
  const tp = t.payments

  const methodLabels: Record<string, string> = {
    CASH: tp.methodCash,
    TRANSFER: tp.methodBankTransfer,
    cash: tp.methodCash,
    bank_transfer: tp.methodBankTransfer,
    credit_card: tp.methodCreditCard,
    check: tp.methodCheck,
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="flex h-32 flex-col items-center justify-center gap-2">
            <Receipt className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{tp.noPayments}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="flex flex-col overflow-hidden rounded-xl border sm:hidden">
        {payments.map((payment) => {
          const income = isIncome(payment)
          const contact = payment.customerPublicId ?? payment.supplierPublicId ?? "—"
          return (
            <div
              key={payment.id}
              className="flex items-center gap-3 border-b bg-card p-4 last:border-b-0"
              onClick={() => onSelect(payment)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {income ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      <TrendingUp className="size-3" />{tp.income}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                      <TrendingDown className="size-3" />{tp.expense}
                    </span>
                  )}
                  <span className="font-mono text-xs text-muted-foreground">{contact}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {methodLabels[payment.paymentMethod] ?? payment.paymentMethod}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className={`font-mono text-sm font-semibold ${income ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {income ? "+" : "-"}{formatCurrency(payment.amount)}
                </span>
                <PaymentActionsMenu payment={payment} onSelect={onSelect} onDelete={onDelete} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop table */}
      <Card className="hidden sm:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[12%] pl-6">
                  <button className="flex items-center gap-1 hover:text-foreground">
                    {tp.colId}
                    <ArrowUpDown className="size-3.5" />
                  </button>
                </TableHead>
                <TableHead className="w-[90px]">{tp.colType}</TableHead>
                <TableHead className="w-[20%]">{tp.colContact}</TableHead>
                <TableHead>{tp.colMethod}</TableHead>
                <TableHead>{tp.colDescription}</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1 hover:text-foreground">
                    {tp.colDate}
                    <ArrowUpDown className="size-3.5" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button className="flex items-center justify-end gap-1 hover:text-foreground">
                    {tp.colAmount}
                    <ArrowUpDown className="size-3.5" />
                  </button>
                </TableHead>
                <TableHead className="pr-6 text-right"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => {
                const income = isIncome(payment)
                const contact = payment.customerPublicId ?? payment.supplierPublicId ?? "—"
                return (
                  <TableRow
                    key={payment.id}
                    className="cursor-pointer"
                    onClick={() => onSelect(payment)}
                  >
                    <TableCell className="pl-6">
                      <span className="font-mono text-sm font-medium">{payment.id}</span>
                    </TableCell>
                    <TableCell>
                      {income ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                          <TrendingUp className="size-3" />
                          {tp.income}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                          <TrendingDown className="size-3" />
                          {tp.expense}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{contact}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {methodLabels[payment.paymentMethod] ?? payment.paymentMethod}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm line-clamp-1 text-muted-foreground">{payment.note || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-mono text-sm font-semibold ${income ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {income ? "+" : "-"}{formatCurrency(payment.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <PaymentActionsMenu payment={payment} onSelect={onSelect} onDelete={onDelete} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
