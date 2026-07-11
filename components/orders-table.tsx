"use client"

import { useLanguage } from "@/lib/language-context"
import { formatCurrency } from "@/lib/utils"
import {
  MoreHorizontal,
  Eye,
  Printer,
  XCircle,
  ShoppingBag,
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
  PENDING: { className: "bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-950 dark:text-amber-400", icon: Clock },
  COMPLETED: { className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400", icon: CheckCircle2 },
  CANCELLED: { className: "bg-gray-100 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400", icon: XCircle },
}
const defaultStatus = { className: "bg-gray-100 text-gray-600", icon: Clock }

interface OrdersTableProps {
  orders: Order[]
  onSelect: (order: Order) => void
  onCancel?: (orderId: string) => void
  isCancelling?: string | null
}

interface OrderActionsProps {
  order: Order
  onSelect: (order: Order) => void
  onCancel?: (orderId: string) => void
  isCancelling?: string | null
}

function OrderActionsMenu({ order, onSelect, onCancel, isCancelling }: OrderActionsProps) {
  const { t } = useLanguage()
  const to = t.orders
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(order) }}>
          <Eye className="mr-2 size-4" />
          {to.viewDetails}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Printer className="mr-2 size-4" />
          {to.printInvoice}
        </DropdownMenuItem>
        {order.status === 'PENDING' && onCancel && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              disabled={isCancelling === order.id}
              onClick={(e) => { e.stopPropagation(); onCancel(order.id) }}
            >
              <XCircle className="mr-2 size-4" />
              {to.cancelOrder}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function OrdersTable({ orders, onSelect, onCancel, isCancelling }: OrdersTableProps) {
  const { t } = useLanguage()
  const to = t.orders

  const statusLabels: Record<string, string> = {
    PENDING: to.pending,
    COMPLETED: to.completed,
    CANCELLED: to.cancelled,
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="flex h-32 flex-col items-center justify-center gap-2">
            <ShoppingBag className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{to.noOrders}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="flex flex-col overflow-hidden rounded-xl border sm:hidden">
        {orders.map((order) => {
          const cfg = statusConfig[order.status] ?? defaultStatus
          const StatusIcon = cfg.icon
          return (
            <div
              key={order.id}
              className={`flex items-center gap-3 border-b p-4 last:border-b-0 ${order.debtAmount > 0 ? 'bg-red-50/40 dark:bg-red-950/20' : 'bg-card'}`}
              onClick={() => onSelect(order)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-medium">{order.orderCode}</p>
                <p className="text-xs text-muted-foreground">{order.customerPublicId ?? to.guest}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}
                  </span>
                  {order.debtAmount > 0 && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="font-mono text-xs text-red-600 dark:text-red-400">
                        {to.modalDebt}: {formatCurrency(order.debtAmount)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <div className="flex flex-col items-end gap-1">
                  <span className="font-mono text-sm font-semibold">{formatCurrency(order.totalAmount)}</span>
                  <Badge variant="secondary" className={`gap-1 text-xs ${cfg.className}`}>
                    <StatusIcon className="size-3" />
                    {statusLabels[order.status] ?? order.status}
                  </Badge>
                </div>
                <OrderActionsMenu order={order} onSelect={onSelect} onCancel={onCancel} isCancelling={isCancelling} />
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
                <TableHead className="w-[15%] pl-6">{to.colOrder}</TableHead>
                <TableHead className="w-[25%]">{to.colCustomer}</TableHead>
                <TableHead>{to.colDate}</TableHead>
                <TableHead>{to.colStatus}</TableHead>
                <TableHead>{to.colTotal}</TableHead>
                <TableHead className="w-[60px] pr-6 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const cfg = statusConfig[order.status] ?? defaultStatus
                const StatusIcon = cfg.icon
                return (
                  <TableRow
                    key={order.id}
                    className={`cursor-pointer ${order.debtAmount > 0 ? "bg-red-50/40 dark:bg-red-950/20" : ""}`}
                    onClick={() => onSelect(order)}
                  >
                    <TableCell className="pl-6">
                      <span className="font-mono text-sm font-medium">{order.orderCode}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {order.customerPublicId ?? to.guest}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`gap-1.5 ${cfg.className}`}>
                        <StatusIcon className="size-3" />
                        {statusLabels[order.status] ?? order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-semibold">{formatCurrency(order.totalAmount)}</span>
                        {order.debtAmount > 0 && (
                          <span className="font-mono text-xs text-red-600 dark:text-red-400">
                            {to.modalDebt}: {formatCurrency(order.debtAmount)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <OrderActionsMenu order={order} onSelect={onSelect} onCancel={onCancel} isCancelling={isCancelling} />
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
