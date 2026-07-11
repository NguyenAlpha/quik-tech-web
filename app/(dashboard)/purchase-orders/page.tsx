'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Plus, Search, ChevronLeft, ChevronRight, Loader2, CheckCircle2, XCircle, X, Banknote, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { TableFooter } from '@/components/table-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/lib/language-context'
import { PageSkeleton } from '@/components/page-skeleton'
import { PageError } from '@/components/page-error'
import { AddPurchaseOrderModal } from '@/components/add-purchase-order-modal'
import { PurchaseOrdersTable } from '@/components/purchase-orders-table'
import { formatCurrency } from '@/lib/utils'
import { PurchaseOrder, PurchaseOrderStatus, CreatePurchaseOrderInput, Supplier, Product, Warehouse } from '@/lib/types'
import {
  getPurchaseOrdersPage,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  updatePurchaseOrderStatus,
  payPurchaseOrder,
  getSuppliers,
  getProducts,
  getWarehouses,
} from '@/lib/api'
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

const PAGE_SIZE = 20

const statusConfig: Record<PurchaseOrderStatus, { className: string }> = {
  [PurchaseOrderStatus.PENDING]:   { className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  [PurchaseOrderStatus.RECEIVED]:  { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  [PurchaseOrderStatus.CANCELLED]: { className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
}

export default function PurchaseOrdersPage() {
  const { t } = useLanguage()
  const tpo = t.purchaseOrders

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [detailPO, setDetailPO] = useState<PurchaseOrder | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [isPayOpen, setIsPayOpen] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [isPayLoading, setIsPayLoading] = useState(false)

  const isFirstRender = useRef(true)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(0)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Initial load
  const init = async () => {
    setIsPageLoading(true)
    setPageError(null)
    try {
      const [result, sups, prods, whs] = await Promise.all([
        getPurchaseOrdersPage({ page: 0, size: PAGE_SIZE }),
        getSuppliers(),
        getProducts(),
        getWarehouses(),
      ])
      setPurchaseOrders(result.content)
      setTotalElements(result.totalElements)
      setTotalPages(result.totalPages)
      setSuppliers(sups)
      setProducts(prods)
      setWarehouses(whs)
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsPageLoading(false)
    }
  }

  useEffect(() => { init() }, [])

  // Subsequent fetches
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    getPurchaseOrdersPage({
      page: currentPage,
      size: PAGE_SIZE,
      orderCode: debouncedSearch || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      from: dateFrom || undefined,
      to: dateTo || undefined,
    })
      .then(result => {
        setPurchaseOrders(result.content)
        setTotalElements(result.totalElements)
        setTotalPages(result.totalPages)
      })
      .catch(() => toast.error('Failed to load purchase orders'))
  }, [currentPage, debouncedSearch, statusFilter, dateFrom, dateTo, refreshTrigger])

  // Reset pay state when modal closes
  useEffect(() => {
    if (!selectedPO) { setIsPayOpen(false); setPayAmount('') }
  }, [selectedPO])

  // Fetch detail when a PO is selected
  useEffect(() => {
    if (!selectedPO) { setDetailPO(null); return }
    setDetailPO(null)
    setIsDetailLoading(true)
    getPurchaseOrder(selectedPO.id)
      .then(setDetailPO)
      .catch(() => setDetailPO(selectedPO))
      .finally(() => setIsDetailLoading(false))
  }, [selectedPO])

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(0)
  }

  const applyPreset = (months: number) => {
    const now = new Date()
    const from = new Date(now)
    from.setMonth(from.getMonth() - months)
    setDateFrom(from.toISOString().split('T')[0])
    setDateTo(now.toISOString().split('T')[0])
    setCurrentPage(0)
  }

  const handleAddPurchaseOrder = async (data: CreatePurchaseOrderInput) => {
    setIsLoading(true)
    try {
      await createPurchaseOrder(data)
      toast.success(tpo.poCreated)
      setIsModalOpen(false)
      setCurrentPage(0)
      setRefreshTrigger(k => k + 1)
    } catch {
      toast.error(tpo.errorCreatingPO)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePurchaseOrder = async (data: CreatePurchaseOrderInput) => {
    if (!editingPO) return
    setIsLoading(true)
    try {
      await updatePurchaseOrder(editingPO.id, data)
      toast.success(tpo.poUpdated)
      setIsModalOpen(false)
      setEditingPO(null)
      setSelectedPO(null)
      setRefreshTrigger(k => k + 1)
    } catch {
      toast.error(tpo.errorUpdatingPO)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePurchaseOrder = async (id: string) => {
    setIsDeleting(id)
    try {
      await deletePurchaseOrder(id)
      toast.success(tpo.poDeleted)
      setRefreshTrigger(k => k + 1)
    } catch {
      toast.error(tpo.errorDeletingPO)
    } finally {
      setIsDeleting(null)
    }
  }

  const handleStatusChange = async (id: string, status: PurchaseOrderStatus) => {
    try {
      await updatePurchaseOrderStatus(id, status)
      toast.success(tpo.poUpdated)
      setRefreshTrigger(k => k + 1)
    } catch {
      toast.error(tpo.errorUpdatingPO)
    }
  }

  const handlePayPO = async () => {
    if (!selectedPO) return
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) return
    setIsPayLoading(true)
    try {
      await payPurchaseOrder(selectedPO.id, amount)
      toast.success(tpo.orderPaid)
      setIsPayOpen(false)
      setPayAmount('')
      setSelectedPO(null)
      setRefreshTrigger(k => k + 1)
    } catch {
      toast.error(tpo.errorPayingOrder)
    } finally {
      setIsPayLoading(false)
    }
  }

  const handleModalStatusChange = async (status: PurchaseOrderStatus) => {
    if (!selectedPO) return
    setIsActionLoading(true)
    try {
      await updatePurchaseOrderStatus(selectedPO.id, status)
      toast.success(tpo.poUpdated)
      setSelectedPO(null)
      setRefreshTrigger(k => k + 1)
    } catch {
      toast.error(tpo.errorUpdatingPO)
    } finally {
      setIsActionLoading(false)
    }
  }

  if (isPageLoading) return <PageSkeleton />
  if (pageError) return <PageError message={pageError} onRetry={init} />

  const displayPO = detailPO ?? selectedPO
  const statusLabels: Record<PurchaseOrderStatus, string> = {
    [PurchaseOrderStatus.PENDING]:   tpo.pending,
    [PurchaseOrderStatus.RECEIVED]:  tpo.received,
    [PurchaseOrderStatus.CANCELLED]: tpo.cancelled,
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-10">
      <PageHeader title={tpo.title} subtitle={tpo.subtitle}>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-sm">
          <Plus className="size-4" />
          {tpo.addPurchaseOrder}
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={tpo.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="h-10 w-full sm:w-[160px]">
              <SelectValue placeholder={tpo.allStatus} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tpo.allStatus}</SelectItem>
              <SelectItem value={PurchaseOrderStatus.PENDING}>{tpo.pending}</SelectItem>
              <SelectItem value={PurchaseOrderStatus.RECEIVED}>{tpo.received}</SelectItem>
              <SelectItem value={PurchaseOrderStatus.CANCELLED}>{tpo.cancelled}</SelectItem>
            </SelectContent>
          </Select>
          {(searchQuery || statusFilter !== 'all' || dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              className="w-fit gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => { setSearchQuery(''); setDebouncedSearch(''); setStatusFilter('all'); setDateFrom(''); setDateTo(''); setCurrentPage(0) }}
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
              onChange={e => { setDateFrom(e.target.value); setCurrentPage(0) }}
              className="h-9 w-32 sm:w-36"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Đến</span>
            <Input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setCurrentPage(0) }}
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

      <PurchaseOrdersTable
        purchaseOrders={purchaseOrders}
        onSelect={setSelectedPO}
        onDelete={handleDeletePurchaseOrder}
        onStatusChange={handleStatusChange}
        isDeleting={isDeleting}
      />

      <TableFooter filtered={purchaseOrders.length} total={totalElements} label={tpo.purchaseOrders}>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </TableFooter>

      {/* Detail Modal */}
      <Dialog open={!!selectedPO} onOpenChange={open => { if (!open) setSelectedPO(null) }}>
        <DialogContent className="w-full max-w-lg sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          {selectedPO && (
            <>
              <DialogHeader className="border-b px-6 py-4">
                <div className="flex items-center gap-4">
                  <DialogTitle className="font-mono text-lg">{selectedPO.orderCode}</DialogTitle>
                  <Badge className={statusConfig[selectedPO.status]?.className ?? 'bg-gray-100 text-gray-600'}>
                    {statusLabels[selectedPO.status]}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6 p-6">
                {/* Order info */}
                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                      {tpo.supplier}
                    </p>
                    <p className="font-medium">{selectedPO.supplierName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                      {tpo.warehouse}
                    </p>
                    <p className="font-medium">{selectedPO.warehouseName}</p>
                  </div>
                  {selectedPO.note && (
                    <div className="col-span-2">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                        {tpo.notes}
                      </p>
                      <p className="text-muted-foreground">{selectedPO.note}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Items */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {tpo.items}
                  </h4>
                  {isDetailLoading ? (
                    <div className="space-y-2.5 py-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                          <div className="h-4 w-10 animate-pulse rounded bg-muted" />
                          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="pl-4">{tpo.product}</TableHead>
                            <TableHead className="text-center">{tpo.quantity}</TableHead>
                            <TableHead className="text-right">{tpo.unitPrice}</TableHead>
                            <TableHead className="pr-4 text-right">{tpo.totalPrice}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(displayPO?.items ?? []).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="h-16 text-center text-sm text-muted-foreground">—</TableCell>
                            </TableRow>
                          ) : (
                            (displayPO?.items ?? []).map((item, idx) => (
                              <TableRow key={`${item.productPublicId}-${idx}`} className="hover:bg-transparent">
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

                {/* Payment summary */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {tpo.detailPaymentInfo}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-base font-semibold">
                      <span>{tpo.totalAmount}</span>
                      <span className="font-mono">{formatCurrency(selectedPO.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tpo.paidAmount}</span>
                      <span className="font-mono text-emerald-600">{formatCurrency(selectedPO.paidAmount)}</span>
                    </div>
                    {selectedPO.debtAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{tpo.debtAmount}</span>
                        <span className="font-mono text-red-600">{formatCurrency(selectedPO.debtAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedPO.status === PurchaseOrderStatus.PENDING && (
                <div className="border-t px-6 py-2 flex justify-start">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground"
                    onClick={() => {
                      setEditingPO(detailPO ?? selectedPO)
                      setIsModalOpen(true)
                    }}
                  >
                    <Pencil className="size-3.5" />
                    {tpo.editPurchaseOrder}
                  </Button>
                </div>
              )}

              {(selectedPO.status === PurchaseOrderStatus.PENDING || (selectedPO.status === PurchaseOrderStatus.RECEIVED && selectedPO.debtAmount > 0)) && (
                <div className="border-t px-6 py-4 space-y-3">
                  {isPayOpen && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0.01}
                        step={0.01}
                        className="h-9"
                        placeholder="0"
                        value={payAmount}
                        onChange={e => setPayAmount(e.target.value)}
                        autoFocus
                      />
                      <Button size="sm" onClick={handlePayPO} disabled={isPayLoading || !payAmount || parseFloat(payAmount) <= 0}>
                        {isPayLoading ? <Loader2 className="size-4 animate-spin" /> : tpo.payOrder}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setIsPayOpen(false); setPayAmount('') }}>✕</Button>
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-2">
                    {selectedPO.status === PurchaseOrderStatus.RECEIVED && selectedPO.debtAmount > 0 && !isPayOpen && (
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => { setIsPayOpen(true); setPayAmount(String(selectedPO.debtAmount)) }}
                      >
                        <Banknote className="size-4" />
                        {tpo.payOrder}
                      </Button>
                    )}
                    {selectedPO.status === PurchaseOrderStatus.PENDING && (
                      <>
                        <Button
                          variant="outline"
                          className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleModalStatusChange(PurchaseOrderStatus.CANCELLED)}
                          disabled={isActionLoading}
                        >
                          {isActionLoading ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                          {tpo.cancelOrder}
                        </Button>
                        <Button
                          className="gap-2"
                          onClick={() => handleModalStatusChange(PurchaseOrderStatus.RECEIVED)}
                          disabled={isActionLoading}
                        >
                          {isActionLoading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                          {tpo.receiveOrder}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <AddPurchaseOrderModal
        open={isModalOpen}
        onOpenChange={open => { setIsModalOpen(open); if (!open) setEditingPO(null) }}
        onSubmit={editingPO ? handleUpdatePurchaseOrder : handleAddPurchaseOrder}
        suppliers={suppliers}
        products={products}
        warehouses={warehouses}
        isLoading={isLoading}
        initialData={editingPO}
      />
    </div>
  )
}
