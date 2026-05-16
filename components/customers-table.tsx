"use client"

import { getInitials, formatCurrency } from "@/lib/utils"
import {
  MoreHorizontal,
  Eye,
  Pencil,
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
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Customer } from "@/lib/types"

const statusStyles: Record<string, { label: string; className: string }> = {
  active: {
    label: "Active",
    className:
      "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400",
  },
  inactive: {
    label: "Inactive",
    className:
      "bg-gray-100 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400",
  },
}

interface CustomersTableProps {
  customers: Customer[]
  onSelect: (customer: Customer) => void
}

export function CustomersTable({ customers, onSelect }: CustomersTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[30%] pl-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <button className="flex items-center gap-1.5 hover:text-foreground">
                  Customer
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Phone
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <button className="flex items-center gap-1.5 hover:text-foreground">
                  Orders
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <button className="flex items-center gap-1.5 hover:text-foreground">
                  Total Spent
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <button className="flex items-center gap-1.5 hover:text-foreground">
                  Debt Balance
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="w-[60px] pr-6 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="size-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      No customers found
                    </p>
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
                        <span className="text-sm font-medium">
                          {customer.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {customer.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {customer.phone}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">
                      {customer.orderCount}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm font-medium">
                      {formatCurrency(customer.totalSpent)}
                    </span>
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
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={statusStyles[customer.status].className}
                    >
                      {statusStyles[customer.status].label}
                    </Badge>
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
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelect(customer)
                          }}
                        >
                          <Eye className="size-4" />
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Pencil className="size-4" />
                          Edit customer
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
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
