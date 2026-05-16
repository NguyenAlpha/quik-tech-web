"use client"

import { useLanguage } from "@/lib/language-context"
import { formatCurrency } from "@/lib/utils"
import {
  MoreHorizontal,
  Eye,
  Trash2,
  ArrowUpDown,
  Receipt,
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
}

export function PaymentsTable({ payments, onSelect }: PaymentsTableProps) {
  const { t } = useLanguage()
  const tp = t.payments

  const methodLabels: Record<string, string> = {
    cash: tp.methodCash,
    bank_transfer: tp.methodBankTransfer,
    credit_card: tp.methodCreditCard,
    check: tp.methodCheck,
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[12%] pl-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <button className="flex items-center gap-1.5 hover:text-foreground">
                  {tp.colId}
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead className="w-[20%] text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {tp.colContact}
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {tp.colMethod}
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {tp.colDescription}
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <button className="flex items-center gap-1.5 hover:text-foreground">
                  {tp.colDate}
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <button className="flex items-center gap-1.5 justify-end hover:text-foreground">
                  {tp.colAmount}
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead className="w-[60px] pr-6 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Receipt className="size-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">{tp.noPayments}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => {
                const contact = payment.customerPublicId ?? payment.supplierPublicId ?? "—"
                return (
                  <TableRow
                    key={payment.id}
                    className="group cursor-pointer"
                    onClick={() => onSelect(payment)}
                  >
                    <TableCell className="pl-6">
                      <span className="font-mono text-sm font-medium">{payment.id}</span>
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
                      <span className="font-mono text-sm font-semibold">
                        {formatCurrency(payment.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={(e) => { e.stopPropagation(); onSelect(payment) }}
                          >
                            <Eye className="size-4" />
                            {tp.viewDetails}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600">
                            <Trash2 className="size-4" />
                            {t.common.delete}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
