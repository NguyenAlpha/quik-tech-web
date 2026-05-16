"use client"

import { getInitials, formatCurrency } from "@/lib/utils"
import {
  MoreHorizontal,
  Eye,
  Trash2,
  ArrowUpDown,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
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
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Payment } from "@/lib/types"

const typeStyles = {
  income: {
    label: "Income",
    className:
      "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400",
    icon: ArrowDownLeft,
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  expense: {
    label: "Expense",
    className:
      "bg-red-50 text-red-700 hover:bg-red-50 dark:bg-red-950 dark:text-red-400",
    icon: ArrowUpRight,
    iconClass: "text-red-600 dark:text-red-400",
  },
}

const methodLabels: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  credit_card: "Credit Card",
  check: "Check",
}

interface PaymentsTableProps {
  payments: Payment[]
  onSelect: (payment: Payment) => void
}

export function PaymentsTable({ payments, onSelect }: PaymentsTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[12%] pl-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <button className="flex items-center gap-1.5 hover:text-foreground">
                  ID
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead className="w-[10%] text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Type
              </TableHead>
              <TableHead className="w-[20%] text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Contact
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Description
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <button className="flex items-center gap-1.5 hover:text-foreground">
                  Date
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Method
              </TableHead>
              <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <button className="flex items-center gap-1.5 justify-end hover:text-foreground">
                  Amount
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
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Receipt className="size-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      No payments found
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => {
                const TypeIcon = typeStyles[payment.type].icon
                return (
                  <TableRow
                    key={payment.id}
                    className="group cursor-pointer"
                    onClick={() => onSelect(payment)}
                  >
                    <TableCell className="pl-6">
                      <span className="font-mono text-sm font-medium">
                        {payment.id}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`gap-1.5 ${typeStyles[payment.type].className}`}
                      >
                        <TypeIcon className="size-3" />
                        {typeStyles[payment.type].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 border">
                          <AvatarFallback className="bg-muted text-xs font-medium">
                            {getInitials(payment.contactName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {payment.contactName}
                          </span>
                          <span className="text-xs capitalize text-muted-foreground">
                            {payment.contactType}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm line-clamp-1">
                          {payment.description}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {payment.reference}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {payment.date}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {methodLabels[payment.method]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <TypeIcon className={`size-4 ${typeStyles[payment.type].iconClass}`} />
                        <span className={`font-mono text-sm font-semibold ${
                          payment.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}>
                          {payment.type === "income" ? "+" : "-"}
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
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
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelect(payment)
                            }}
                          >
                            <Eye className="size-4" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600">
                            <Trash2 className="size-4" />
                            Delete
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
