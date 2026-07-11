'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/language-context'
import { formatCurrency } from '@/lib/utils'
import {
  getOrdersPage, getOrder, createOrder, completeOrder, cancelOrder, payOrder,
  getCustomers, getWarehouses, searchProducts, exportOrdersExcel, ApiError,
} from '@/lib/api'
import { OrdersTable } from '@/components/orders-table'
import { AddOrderModal } from '@/components/add-order-modal'
import { PageSkeleton } from '@/components/page-skeleton'
import { PageHeader } from '@/components/page-header'
import { TableFooter } from '@/components/table-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Plus,
  X,
  Printer,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Banknote,
  Download,
} from 'lucide-react'
import { printOrder } from '@/lib/print-invoice'
import type { Order, Customer, Warehouse, Product, CreateOrderInput } from '@/lib/types'

const statusConfig: Record<string, { className: string; icon: typeof Clock }> = {
  PENDING: { className: 'bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-950 dark:text-amber-400', icon: Clock },
  COMPLETED: { className: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400', icon: CheckCircle2 },
  CANCELLED: { className: 'bg-gray-100 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400', icon: XCircle },
}
const defaultStatusConfig = { className: 'bg-gray-100 text-gray-600', icon: Clock }

export default function OrdersPage() {
  const { t } = useLanguage()
  const to = t.orders

  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const [isPageLoading, setIsPageLoading] = useState(true)
  const hasLoaded = useRef(false)
  const isFirstRender = useRef(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [isCancelling, setIsCancelling] = useState<string | null>(null)

  const [isExporting, setIsExporting] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreateLoading, setIsCreateLoading] = useState(false)
  const [isPayOpen, setIsPayOpen] = useState(false)
  const [payAmount, setPayAmount] = useState(0)
  const [isPayLoading, setIsPayLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      getCustomers(),
      getWarehouses(),
      searchProducts({ size: 100, isActive: true }),
    ]).then(([custs, warehs, prods]) => {
      setCustomers(custs)
      setWarehouses(warehs)
      setProducts(prods.content)
    }).catch(() => {})
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(0)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Initial load
  useEffect(() => {
    const load = async () => {
      setIsPageLoading(true)
      try {
        const result = await getOrdersPage({ page: 0, size: 20 })
        setOrders(result.content)
        setTotalPages(result.totalPages)
        setTotalElements(result.totalElements)
      } catch {
        toast.error('Failed to load orders')
      } finally {
        setIsPageLoading(false)
        hasLoaded.current = true
      }
    }
    load()
  }, [])

  // Subsequent fetches
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    setIsPageLoading(true)
    getOrdersPage({
      page,
      size: 20,
      orderCode: debouncedSearch || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      from: dateFrom || undefined,
      to: dateTo || undefined,
    })
      .then(result => {
        setOrders(result.content)
        setTotalPages(result.totalPages)
        setTotalElements(result.totalElements)
      })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setIsPageLoading(false))
  }, [page, debouncedSearch, statusFilter, dateFrom, dateTo, refreshKey])

  useEffect(() => {
    if (!selectedOrder) {
      setDetailOrder(null)
      return
    }
    setDetailOrder(null)
    setIsDetailLoading(true)
    getOrder(selectedOrder.id)
      .then(setDetailOrder)
      .catch(() => setDetailOrder(selectedOrder))
      .finally(() => setIsDetailLoading(false))
  }, [selectedOrder])

  const handleCreateOrder = async (input: CreateOrderInput) => {
    setIsCreateLoading(true)
    try {
      await createOrder(input)
      toast.success(to.orderCreated)
      setIsCreateOpen(false)
      setPage(0)
      setRefreshKey(k => k + 1)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : to.errorCreatingOrder)
    } finally {
      setIsCreateLoading(false)
    }
  }

  const handleCompleteOrder = async () => {
    if (!selectedOrder) return
    setIsActionLoading(true)
    try {
      await completeOrder(selectedOrder.id)
      toast.success(to.orderCompleted)
      setSelectedOrder(null)
      setRefreshKey(k => k + 1)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : to.errorCompletingOrder)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleCancelFromModal = async () => {
    if (!selectedOrder) return
    setIsActionLoading(true)
    try {
      await cancelOrder(selectedOrder.id)
      toast.success(to.orderCancelled)
      setSelectedOrder(null)
      setRefreshKey(k => k + 1)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : to.errorCancellingOrder)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handlePayOrder = async () => {
    if (!selectedOrder || payAmount <= 0) return
    setIsPayLoading(true)
    try {
      await payOrder(selectedOrder.id, payAmount)
      toast.success(to.orderPaid)
      setIsPayOpen(false)
      setPayAmount(0)
      setSelectedOrder(null)
      setRefreshKey(k => k + 1)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : to.errorPayingOrder)
    } finally {
      setIsPayLoading(false)
    }
  }

  const handleCancelFromTable = async (orderId: string) => {
    setIsCancelling(orderId)
    try {
      await cancelOrder(orderId)
      toast.success(to.orderCancelled)
      setRefreshKey(k => k + 1)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : to.errorCancellingOrder)
    } finally {
      setIsCancelling(null)
    }
  }

  const applyPreset = (months: number) => {
    const now = new Date()
    const from = new Date(now)
    from.setMonth(from.getMonth() - months)
    setDateFrom(from.toISOString().split('T')[0])
    setDateTo(now.toISOString().split('T')[0])
    setPage(0)
  }

  const displayOrder = detailOrder ?? selectedOrder
  const statusLabels: Record<string, string> = {
    PENDING: to.pending,
    COMPLETED: to.completed,
    CANCELLED: to.cancelled,
  }

  if (isPageLoading && !hasLoaded.current) return <PageSkeleton />

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-10">
      <PageHeader title={to.title} subtitle={to.subtitle}>
        <Button
          variant="outline"
          className="gap-2 shadow-sm"
          disabled={isExporting}
          onClick={async () => {
            setIsExporting(true)
            try {
              await exportOrdersExcel(dateFrom || undefined, dateTo || undefined)
              toast.success(to.exportSuccess)
            } catch {
              toast.error(to.exportError)
            } finally {
              setIsExporting(false)
            }
          }}
        >
          <Download className="size-4" />
          {isExporting ? to.exporting : to.exportExcel}
        </Button>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-sm">
          <Plus className="size-4" />
          {to.createOrder}
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={to.searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-10 pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0) }}>
            <SelectTrigger className="h-10 w-full sm:w-[180px]">
              <SelectValue placeholder={to.filterByStatus} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{to.allStatus}</SelectItem>
              <SelectItem value="PENDING">{to.pending}</SelectItem>
              <SelectItem value="COMPLETED">{to.completed}</SelectItem>
              <SelectItem value="CANCELLED">{to.cancelled}</SelectItem>
            </SelectContent>
          </Select>
          {(searchQuery || statusFilter !== 'all' || dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              className="w-fit gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => { setSearchQuery(''); setDebouncedSearch(''); setStatusFilter('all'); setDateFrom(''); setDateTo(''); setPage(0) }}
            >
              <X className="size-3.5" />
              Reset filter
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Từ</span>
            <Input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(0) }}
              className="h-9 w-32 sm:w-36"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Đến</span>
            <Input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(0) }}
              className="h-9 w-32 sm:w-36"
            />
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => applyPreset(3)}>3 tháng</Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset(6)}>6 tháng</Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset(12)}>1 năm</Button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <OrdersTable
        orders={orders}
        onSelect={setSelectedOrder}
        onCancel={handleCancelFromTable}
        isCancelling={isCancelling}
      />

      <TableFooter filtered={orders.length} total={totalElements} label={to.orders}>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0 || isPageLoading}
            >
              Previous
            </Button>
            <span className="text-sm">{page + 1} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1 || isPageLoading}
            >
              Next
            </Button>
          </div>
        )}
      </TableFooter>

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={open => { if (!open) { setSelectedOrder(null); setIsPayOpen(false); setPayAmount(0) } }}>
        <DialogContent className="w-full max-w-lg sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          {selectedOrder && (
            <>
              <DialogHeader className="border-b px-6 py-4">
                <div className="flex items-center gap-4">
                  <DialogTitle className="font-mono text-lg">
                    {selectedOrder.orderCode}
                  </DialogTitle>
                  {(() => {
                    const cfg = statusConfig[selectedOrder.status] ?? defaultStatusConfig
                    const StatusIcon = cfg.icon
                    return (
                      <Badge variant="secondary" className={`gap-1.5 ${cfg.className}`}>
                        <StatusIcon className="size-3" />
                        {statusLabels[selectedOrder.status] ?? selectedOrder.status}
                      </Badge>
                    )
                  })()}</div>
              </DialogHeader>

              <div className="space-y-6 p-6">
                {/* Customer */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {to.modalCustomer}
                  </h4>
                  <p className="text-sm font-medium">
                    {selectedOrder.customerPublicId
                      ? (customers.find(c => c.id === selectedOrder.customerPublicId)?.name ?? selectedOrder.customerPublicId)
                      : to.guest}
                  </p>
                  {selectedOrder.note && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.note}</p>
                  )}
                </div>

                <Separator />

                {/* Items */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {to.modalItems}
                  </h4>
                  {isDetailLoading ? (
                    <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="pl-4">{to.modalProduct}</TableHead>
                            <TableHead className="text-center">{to.modalQty}</TableHead>
                            <TableHead className="text-right">{to.modalPrice}</TableHead>
                            <TableHead className="pr-4 text-right">{to.modalTotal}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(displayOrder?.items ?? []).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="h-16 text-center text-sm text-muted-foreground">
                                —
                              </TableCell>
                            </TableRow>
                          ) : (
                            (displayOrder?.items ?? []).map(item => (
                              <TableRow key={item.id} className="hover:bg-transparent">
                                <TableCell className="pl-4">
                                  <span className="text-sm font-medium">{item.productName}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="text-sm">{item.quantity}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="font-mono text-sm">{formatCurrency(item.unitPrice)}</span>
                                </TableCell>
                                <TableCell className="pr-4 text-right">
                                  <span className="font-mono text-sm font-medium">{formatCurrency(item.totalPrice)}</span>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Summary */}
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
                        <span className="text-muted-foreground">{to.modalDiscount}</span>
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
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{to.modalPaid}</span>
                      <span className="font-mono text-emerald-600">{formatCurrency(selectedOrder.paidAmount)}</span>
                    </div>
                    {selectedOrder.debtAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{to.modalDebt}</span>
                        <span className="font-mono text-red-600">{formatCurrency(selectedOrder.debtAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={isDetailLoading}
                  onClick={() => {
                    const order = displayOrder ?? selectedOrder
                    if (!order) return
                    const customerName = order.customerPublicId
                      ? (customers.find(c => c.id === order.customerPublicId)?.name ?? order.customerPublicId)
                      : to.guest
                    printOrder(order, customerName)
                  }}
                >
                  <Printer className="size-4" />
                  {to.modalPrintInvoice}
                </Button>
                <div className="flex items-center gap-2">
                  {(displayOrder ?? selectedOrder).debtAmount > 0 && selectedOrder.status !== 'CANCELLED' && (
                    isPayOpen ? (
                      <>
                        <Input
                          type="number"
                          min={0.01}
                          max={(displayOrder ?? selectedOrder).debtAmount}
                          value={payAmount}
                          onChange={e => setPayAmount(Number(e.target.value))}
                          className="h-9 w-32 text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={handlePayOrder}
                          disabled={isPayLoading || payAmount <= 0 || payAmount > (displayOrder ?? selectedOrder).debtAmount}
                        >
                          {isPayLoading && <Loader2 className="mr-1 size-4 animate-spin" />}
                          {to.payOrder}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setIsPayOpen(false); setPayAmount(0) }}
                        >
                          <X className="size-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => { setIsPayOpen(true); setPayAmount((displayOrder ?? selectedOrder).debtAmount) }}
                      >
                        <Banknote className="size-4" />
                        {to.payOrder}
                      </Button>
                    )
                  )}
                  {selectedOrder.status === 'PENDING' && (
                    <>
                      <Button
                        variant="outline"
                        className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-600"
                        onClick={handleCancelFromModal}
                        disabled={isActionLoading}
                      >
                        {isActionLoading
                          ? <Loader2 className="size-4 animate-spin" />
                          : <XCircle className="size-4" />}
                        {to.modalCancelOrder}
                      </Button>
                      <Button
                        className="gap-2"
                        onClick={handleCompleteOrder}
                        disabled={isActionLoading}
                      >
                        {isActionLoading
                          ? <Loader2 className="size-4 animate-spin" />
                          : <CheckCircle2 className="size-4" />}
                        {to.completeOrder}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Order Modal */}
      <AddOrderModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateOrder}
        isLoading={isCreateLoading}
        customers={customers}
        warehouses={warehouses}
        products={products}
      />
    </div>
  )
}
