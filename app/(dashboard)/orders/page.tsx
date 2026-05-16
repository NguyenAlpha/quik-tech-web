"use client"

import { useState, useMemo, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { formatCurrency } from "@/lib/utils"
import { getOrders } from "@/lib/api"
import { OrdersTable } from "@/components/orders-table"
import {
  Search,
  Printer,
  XCircle,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  X,
  Plus,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { TableFooter } from "@/components/table-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { Order } from "@/lib/types"

const statusConfig: Record<
  string,
  { label: string; className: string; icon: typeof Clock }
> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-950 dark:text-amber-400", icon: Clock },
  processing: { label: "Processing", className: "bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-950 dark:text-blue-400", icon: Package },
  shipped: { label: "Shipped", className: "bg-violet-50 text-violet-700 hover:bg-violet-50 dark:bg-violet-950 dark:text-violet-400", icon: Truck },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400", icon: XCircle },
}

const defaultStatusConfig = {
  label: "Unknown",
  className: "bg-gray-100 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400",
  icon: Clock,
}

export default function OrdersPage() {
  const { t } = useLanguage()
  const to = t.orders
  const [orders, setOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    getOrders().then(setOrders)
  }, [])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customerPublicId ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchQuery, statusFilter, orders])

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 lg:p-10">
      {/* Page Header */}
      <PageHeader title={to.title} subtitle={to.subtitle}>
        <Button className="gap-2 shadow-sm">
          <Plus className="size-4" />
          {to.createOrder}
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={to.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[180px]">
            <SelectValue placeholder={to.filterByStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{to.allStatus}</SelectItem>
            <SelectItem value="pending">{to.pending}</SelectItem>
            <SelectItem value="processing">{to.processing}</SelectItem>
            <SelectItem value="shipped">{to.shipped}</SelectItem>
            <SelectItem value="completed">{to.completed}</SelectItem>
            <SelectItem value="cancelled">{to.cancelled}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <OrdersTable orders={filteredOrders} onSelect={setSelectedOrder} />

      {/* Table Footer */}
      <TableFooter filtered={filteredOrders.length} total={orders.length} label={to.orders} />

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl p-0">
          {selectedOrder && (
            <>
              <DialogHeader className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <DialogTitle className="font-mono text-lg">
                      {selectedOrder.orderCode}
                    </DialogTitle>
                    {(() => {
                      const config = statusConfig[selectedOrder.status] ?? defaultStatusConfig
                      const StatusIcon = config.icon
                      return (
                        <Badge
                          variant="secondary"
                          className={`gap-1.5 ${config.className}`}
                        >
                          <StatusIcon className="size-3" />
                          {to[selectedOrder.status as keyof typeof to] ?? selectedOrder.status}
                        </Badge>
                      )
                    })()}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setSelectedOrder(null)}
                  >
                    <X className="size-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-6 p-6">
                {/* Customer Info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {to.modalCustomer}
                  </h4>
                  <p className="text-sm font-medium">
                    {selectedOrder.customerPublicId ?? "Guest"}
                  </p>
                  {selectedOrder.note && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.note}</p>
                  )}
                </div>

                <Separator />

                {/* Order Items */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {to.modalItems}
                  </h4>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="pl-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {to.modalProduct}
                          </TableHead>
                          <TableHead className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {to.modalQty}
                          </TableHead>
                          <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {to.modalPrice}
                          </TableHead>
                          <TableHead className="pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {to.modalTotal ?? "Total"}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item) => (
                          <TableRow key={item.id} className="hover:bg-transparent">
                            <TableCell className="pl-4">
                              <span className="text-sm font-medium">{item.productName}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm">{item.quantity}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-mono text-sm">
                                {formatCurrency(item.unitPrice)}
                              </span>
                            </TableCell>
                            <TableCell className="pr-4 text-right">
                              <span className="font-mono text-sm font-medium">
                                {formatCurrency(item.totalPrice)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <Separator />

                {/* Order Summary */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {to.modalSummary}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{to.modalSubtotal}</span>
                      <span className="font-mono">{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{to.modalDiscount ?? "Discount"}</span>
                        <span className="font-mono text-emerald-600">
                          -{formatCurrency(selectedOrder.discount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{to.modalTax}</span>
                      <span className="font-mono">{formatCurrency(selectedOrder.tax)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-base font-semibold">
                      <span>{to.modalTotal}</span>
                      <span className="font-mono">{formatCurrency(selectedOrder.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{to.modalPaid ?? "Paid"}</span>
                      <span className="font-mono text-emerald-600">
                        {formatCurrency(selectedOrder.paidAmount)}
                      </span>
                    </div>
                    {selectedOrder.debtAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{to.modalDebt ?? "Outstanding"}</span>
                        <span className="font-mono text-red-600">
                          {formatCurrency(selectedOrder.debtAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 border-t px-6 py-4">
                <Button variant="outline" className="gap-2">
                  <Printer className="size-4" />
                  {to.modalPrintInvoice}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
