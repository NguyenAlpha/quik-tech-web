"use client"

import { useState, useMemo, useEffect } from "react"
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
import type { Order, OrderItem } from "@/lib/types"

const statusConfig: Record<
  Order["status"],
  { label: string; className: string; icon: typeof Clock }
> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-950 dark:text-amber-400", icon: Clock },
  processing: { label: "Processing", className: "bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-950 dark:text-blue-400", icon: Package },
  shipped: { label: "Shipped", className: "bg-violet-50 text-violet-700 hover:bg-violet-50 dark:bg-violet-950 dark:text-violet-400", icon: Truck },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400", icon: XCircle },
}


export default function OrdersPage() {
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
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchQuery, statusFilter])

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 lg:p-10">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Orders
          </h1>
          <p className="text-base text-muted-foreground">
            View and manage customer orders
          </p>
        </div>
        <Button className="gap-2 shadow-sm">
          <Plus className="size-4" />
          Create Order
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <OrdersTable orders={filteredOrders} onSelect={setSelectedOrder} />

      {/* Table Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Showing{" "}
          <span className="font-medium text-foreground">
            {filteredOrders.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">{orders.length}</span>{" "}
          orders
        </p>
      </div>

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl p-0">
          {selectedOrder && (
            <>
              <DialogHeader className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <DialogTitle className="font-mono text-lg">
                      {selectedOrder.id}
                    </DialogTitle>
                    <Badge
                      variant="secondary"
                      className={`gap-1.5 ${statusConfig[selectedOrder.status].className}`}
                    >
                      {(() => {
                        const StatusIcon = statusConfig[selectedOrder.status].icon
                        return <StatusIcon className="size-3" />
                      })()}
                      {statusConfig[selectedOrder.status].label}
                    </Badge>
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
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Customer
                    </h4>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 border">
                        <AvatarFallback className="bg-muted text-sm font-medium">
                          {getInitials(selectedOrder.customer)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{selectedOrder.customer}</span>
                        <span className="text-sm text-muted-foreground">
                          {selectedOrder.email}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {selectedOrder.phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Shipping Address
                    </h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {selectedOrder.shippingAddress}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Order Items */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Items
                  </h4>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="pl-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Product
                          </TableHead>
                          <TableHead className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Qty
                          </TableHead>
                          <TableHead className="pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Price
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item, index) => (
                          <TableRow key={index} className="hover:bg-transparent">
                            <TableCell className="pl-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{item.name}</span>
                                <span className="font-mono text-xs text-muted-foreground">
                                  {item.sku}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm">{item.quantity}</span>
                            </TableCell>
                            <TableCell className="pr-4 text-right">
                              <span className="font-mono text-sm font-medium">
                                {formatCurrency(item.price * item.quantity)}
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
                    Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-mono">
                        {formatCurrency(selectedOrder.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-mono">
                        {formatCurrency(selectedOrder.shipping)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="font-mono">
                        {formatCurrency(selectedOrder.tax)}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-base font-semibold">
                      <span>Total</span>
                      <span className="font-mono">
                        {formatCurrency(selectedOrder.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 border-t px-6 py-4">
                <Button variant="outline" className="gap-2">
                  <Printer className="size-4" />
                  Print Invoice
                </Button>
                {selectedOrder.status !== "cancelled" &&
                  selectedOrder.status !== "completed" && (
                    <Button variant="destructive" className="gap-2">
                      <XCircle className="size-4" />
                      Cancel Order
                    </Button>
                  )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
