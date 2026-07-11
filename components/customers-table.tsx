"use client"

import { useLanguage } from "@/lib/language-context"
import { getInitials, formatCurrency } from "@/lib/utils"
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ArrowUpDown,
  Users,
  AlertCircle,
  Loader2,
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
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
  isDeleting?: string | null
}

interface CustomerActionsProps {
  customer: Customer
  isDeleting?: string | null
  onSelect: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

function CustomerActionsMenu({ customer, isDeleting, onSelect, onEdit, onDelete }: CustomerActionsProps) {
  const { t } = useLanguage()
  const tc = t.customers
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isDeleting === customer.id} onClick={(e) => e.stopPropagation()}>
          {isDeleting === customer.id
            ? <Loader2 className="size-4 animate-spin" />
            : <MoreHorizontal className="size-4" />}
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onSelect(customer)}>
          <Eye className="mr-2 size-4" />
          {tc.viewDetails}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(customer)}>
          <Pencil className="mr-2 size-4" />
          {t.common.edit}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(customer)}>
          <Trash2 className="mr-2 size-4" />
          {t.common.delete}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const debtClass = (debt: number) =>
  debt > 1000
    ? "text-red-600 dark:text-red-400"
    : debt > 0
    ? "text-amber-600 dark:text-amber-400"
    : "text-emerald-600 dark:text-emerald-400"

const rowBg = (debt: number) =>
  debt > 1000
    ? "bg-red-50/50 dark:bg-red-950/20"
    : debt > 0
    ? "bg-amber-50/30 dark:bg-amber-950/10"
    : ""

export function CustomersTable({ customers, onSelect, onEdit, onDelete, isDeleting }: CustomersTableProps) {
  const { t } = useLanguage()
  const tc = t.customers

  if (customers.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="flex h-32 flex-col items-center justify-center gap-2">
            <Users className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{tc.noCustomers}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="flex flex-col overflow-hidden rounded-xl border sm:hidden">
        {customers.map((customer) => (
          <div
            key={customer.id}
            className={`flex items-center gap-3 border-b p-4 last:border-b-0 ${rowBg(customer.debtBalance) || 'bg-card'}`}
            onClick={() => onSelect(customer)}
          >
            <Avatar className="size-9 shrink-0 border">
              <AvatarFallback className="bg-muted text-sm font-medium">
                {getInitials(customer.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{customer.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{customer.phone || '—'}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <div className="flex items-center gap-1">
                {customer.debtBalance > 0 && <AlertCircle className="size-3.5 text-red-500" />}
                <span className={`font-mono text-sm font-semibold ${debtClass(customer.debtBalance)}`}>
                  {formatCurrency(customer.debtBalance)}
                </span>
              </div>
              <CustomerActionsMenu
                customer={customer}
                isDeleting={isDeleting}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="hidden sm:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[30%] pl-6">
                  <button className="flex items-center gap-1 hover:text-foreground">
                    {tc.colCustomer}
                    <ArrowUpDown className="size-3.5" />
                  </button>
                </TableHead>
                <TableHead>{tc.colPhone}</TableHead>
                <TableHead>{tc.colEmail}</TableHead>
                <TableHead>{tc.colAddress}</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1 hover:text-foreground">
                    {tc.colDebtBalance}
                    <ArrowUpDown className="size-3.5" />
                  </button>
                </TableHead>
                <TableHead className="pr-6 text-right"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className={`cursor-pointer ${
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
                      <span className={`font-mono text-sm font-semibold ${debtClass(customer.debtBalance)}`}>
                        {formatCurrency(customer.debtBalance)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-6 text-right" onClick={e => e.stopPropagation()}>
                    <CustomerActionsMenu
                      customer={customer}
                      isDeleting={isDeleting}
                      onSelect={onSelect}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
