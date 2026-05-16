"use client"

import { useLanguage } from "@/lib/language-context"
import { getInitials, formatCurrency } from "@/lib/utils"
import {
  MoreHorizontal,
  Eye,
  Trash2,
  ArrowUpDown,
  Users,
  AlertCircle,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Customer } from "@/lib/types"

interface CustomersTableProps {
  customers: Customer[]
  onSelect: (customer: Customer) => void
}

export function CustomersTable({ customers, onSelect }: CustomersTableProps) {
  const { t } = useLanguage()
  const tc = t.customers

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[30%] pl-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <button className="flex items-center gap-1.5 hover:text-foreground">
                  {tc.colCustomer}
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {tc.colPhone}
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {tc.colEmail}
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {tc.colAddress}
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <button className="flex items-center gap-1.5 hover:text-foreground">
                  {tc.colDebtBalance}
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead className="w-[60px] pr-6 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="size-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">{tc.noCustomers}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className={`group cursor-pointer ${
                    customer.debtBalance > 1000
                      ? "bg-red-50/50 hover:bg-red-50 dark:bg-red-950/20 dark:hover:bg-red-950/30"
                      : customer.debtBalance > 0
                      ? "bg-amber-50/30 hover:bg-amber-50/50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20"
                      : ""
                  }`}
                  onClick={() => onSelect(customer)}
                >
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 border">
                        <AvatarFallback className="bg-muted text-sm font-medium">
                          {getInitials(customer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{customer.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">{customer.code}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{customer.phone}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{customer.email}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{customer.address}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {customer.debtBalance > 0 && (
                        <AlertCircle className="size-4 text-red-500" />
                      )}
                      <span
                        className={`font-mono text-sm font-semibold ${
                          customer.debtBalance > 1000
                            ? "text-red-600 dark:text-red-400"
                            : customer.debtBalance > 0
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {formatCurrency(customer.debtBalance)}
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
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={(e) => { e.stopPropagation(); onSelect(customer) }}
                        >
                          <Eye className="size-4" />
                          {tc.viewDetails}
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
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
