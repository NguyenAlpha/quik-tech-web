"use client"

import { useLanguage } from "@/lib/language-context"
import { formatCurrency } from "@/lib/utils"
import {
  MoreHorizontal,
  Eye,
  Printer,
  XCircle,
  ArrowUpDown,
  ShoppingBag,
  Package,
  Truck,
  CheckCircle2,
  Clock,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Order } from "@/lib/types"

const statusConfig: Record<string, { className: string; icon: typeof Clock }> = {
  pending: { className: "bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-950 dark:text-amber-400", icon: Clock },
  processing: { className: "bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-950 dark:text-blue-400", icon: Package },
  shipped: { className: "bg-violet-50 text-violet-700 hover:bg-violet-50 dark:bg-violet-950 dark:text-violet-400", icon: Truck },
  completed: { className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400", icon: CheckCircle2 },
  cancelled: { className: "bg-gray-100 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400", icon: XCircle },
}

const defaultStatus = { className: "bg-gray-100 text-gray-600", icon: Clock }

interface OrdersTableProps {
  orders: Order[]
  onSelect: (order: Order) => void
}

export function OrdersTable({ orders, onSelect }: OrdersTableProps) {
  const { t } = useLanguage()
  const to = t.orders

  const statusLabels: Record<string, string> = {
    pending: to.pending,
    processing: to.processing,
    shipped: to.shipped,
    completed: to.completed,
    cancelled: to.cancelled,
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[15%] pl-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <button className="flex items-center gap-1.5 hover:text-foreground">
                  {to.colOrder}
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead className="w-[25%] text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {to.colCustomer}
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <button className="flex items-center gap-1.5 hover:text-foreground">
                  {to.colDate}
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {to.colStatus}
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <button className="flex items-center gap-1.5 hover:text-foreground">
                  {to.colTotal}
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead className="w-[60px] pr-6 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingBag className="size-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">{to.noOrders}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const cfg = statusConfig[order.status] ?? defaultStatus
                const StatusIcon = cfg.icon
                return (
                  <TableRow
                    key={order.id}
                    className="group cursor-pointer"
                    onClick={() => onSelect(order)}
                  >
                    <TableCell className="pl-6">
                      <span className="font-mono text-sm font-medium">{order.orderCode}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {order.customerPublicId ?? "Guest"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`gap-1.5 ${cfg.className}`}
                      >
                        <StatusIcon className="size-3" />
                        {statusLabels[order.status] ?? order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm font-semibold">{formatCurrency(order.totalAmount)}</span>
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
                            onClick={(e) => { e.stopPropagation(); onSelect(order) }}
                          >
                            <Eye className="size-4" />
                            {to.viewDetails}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Printer className="size-4" />
                            {to.printInvoice}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600">
                            <XCircle className="size-4" />
                            {to.cancelOrder}
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
