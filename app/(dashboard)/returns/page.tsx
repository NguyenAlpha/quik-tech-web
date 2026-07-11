'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/language-context'
import { formatCurrency } from '@/lib/utils'
import {
  getReturnOrders, getReturnOrder, createReturnOrder, completeReturnOrder, cancelReturnOrder,
  getWarehouses, searchProducts, getOrders, ApiError,
} from '@/lib/api'
import { PageSkeleton } from '@/components/page-skeleton'
import { PageError } from '@/components/page-error'
import { PageHeader } from '@/components/page-header'
import { TableFooter } from '@/components/table-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
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
  DialogFooter,
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
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
} from 'lucide-react'
import type {
  ReturnOrder, Warehouse, Product, Order,
  CreateReturnOrderInput, CreateReturnOrderItemInput,
} from '@/lib/types'

const statusConfig: Record<string, { className: string; icon: typeof Clock }> = {
  PENDING: { className: 'bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-950 dark:text-amber-400', icon: Clock },
  COMPLETED: { className: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400', icon: CheckCircle2 },
  CANCELLED: { className: 'bg-gray-100 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400', icon: XCircle },
}

const emptyItem = (): CreateReturnOrderItemInput => ({ productPublicId: '', quantity: 1, unitPrice: 0 })

const defaultCreateForm = {
  returnCode: '',
  originalOrderPublicId: '',
  warehousePublicId: '',
  reason: '',
  refundMethod: 'CASH' as 'CASH' | 'BANK_TRANSFER' | 'STORE_CREDIT',
  note: '',
}

export default function ReturnsPage() {
  const { t } = useLanguage()
  const tr = t.returns

  const [returns, setReturns] = useState<ReturnOrder[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [isPageLoading, setIsPageLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const hasLoaded = useRef(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const [selectedReturn, setSelectedReturn] = useState<ReturnOrder | null>(null)
  const [detailReturn, setDetailReturn] = useState<ReturnOrder | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(defaultCreateForm)
  const [createItems, setCreateItems] = useState<CreateReturnOrderItemInput[]>([emptyItem()])
  const [isCreateLoading, setIsCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      getWarehouses(),
      searchProducts({ size: 100, isActive: true }),
      getOrders(),
    ]).then(([warehs, prods, ords]) => {
      setWarehouses(warehs)
      setProducts(prods.content)
      setOrders(ords)
    }).catch(() => {})
  }, [])

  const init = async () => {
    setIsPageLoading(true)
    setPageError(null)
    try {
      const data = await getReturnOrders()
      setReturns(data)
      hasLoaded.current = true
    } catch (err) {
      setPageError(err instanceof ApiError ? err.message : 'Failed to load data')
    } finally {
      setIsPageLoading(false)
    }
  }

  useEffect(() => {
    if (refreshKey === 0 && !hasLoaded.current) { init(); return }
    getReturnOrders()
      .then(data => setReturns(data))
      .catch(() => toast.error('Failed to load returns'))
  }, [refreshKey])

  useEffect(() => {
    if (!selectedReturn) { setDetailReturn(null); return }
    setDetailReturn(null)
    setIsDetailLoading(true)
    getReturnOrder(selectedReturn.id)
      .then(setDetailReturn)
      .catch(() => setDetailReturn(selectedReturn))
      .finally(() => setIsDetailLoading(false))
  }, [selectedReturn])

  const filteredReturns = useMemo(() => returns.filter(r => {
    const matchesSearch = r.returnCode.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesSearch && matchesStatus
  }), [returns, searchQuery, statusFilter])

  const handleComplete = async () => {
    if (!selectedReturn) return
    setIsActionLoading(true)
    try {
      await completeReturnOrder(selectedReturn.id)
      toast.success(tr.returnCompleted)
      setSelectedReturn(null)
      setRefreshKey(k => k + 1)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : tr.errorCompleting)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!selectedReturn) return
    setIsActionLoading(true)
    try {
      await cancelReturnOrder(selectedReturn.id)
      toast.success(tr.returnCancelled)
      setSelectedReturn(null)
      setRefreshKey(k => k + 1)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : tr.errorCancelling)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleCreate = async () => {
    setIsCreateLoading(true)
    setCreateError(null)
    try {
      await createReturnOrder({
        returnCode: createForm.returnCode || undefined,
        originalOrderPublicId: createForm.originalOrderPublicId || undefined,
        warehousePublicId: createForm.warehousePublicId,
        reason: createForm.reason,
        refundMethod: createForm.refundMethod,
        note: createForm.note || undefined,
        items: createItems,
      })
      toast.success(tr.returnCreated)
      setIsCreateOpen(false)
      setCreateForm(defaultCreateForm)
      setCreateItems([emptyItem()])
      setRefreshKey(k => k + 1)
    } catch (error) {
      setCreateError(error instanceof ApiError ? error.message : tr.errorCreating)
    } finally {
      setIsCreateLoading(false)
    }
  }

  const updateItem = (idx: number, patch: Partial<CreateReturnOrderItemInput>) =>
    setCreateItems(items => items.map((it, i) => i === idx ? { ...it, ...patch } : it))

  const statusLabels: Record<string, string> = {
    PENDING: tr.pending,
    COMPLETED: tr.completed,
    CANCELLED: tr.cancelled,
  }

  const displayReturn = detailReturn ?? selectedReturn
  const isCreateValid = !!createForm.warehousePublicId && !!createForm.reason && createItems.every(i => !!i.productPublicId)

  if (isPageLoading && !hasLoaded.current) return <PageSkeleton />
  if (pageError && !hasLoaded.current) return <PageError message={pageError} onRetry={init} />

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-10">
      <PageHeader title={tr.title} subtitle={tr.subtitle}>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-sm">
          <Plus className="size-4" />
          {tr.createReturn}
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={tr.searchPlaceholder}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[180px]">
            <SelectValue placeholder={tr.filterByStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tr.allStatus}</SelectItem>
            <SelectItem value="PENDING">{tr.pending}</SelectItem>
            <SelectItem value="COMPLETED">{tr.completed}</SelectItem>
            <SelectItem value="CANCELLED">{tr.cancelled}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile card list */}
      <div className="flex flex-col overflow-hidden rounded-xl border sm:hidden">
        {filteredReturns.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            {tr.noReturns}
          </div>
        ) : filteredReturns.map(r => {
          const cfg = statusConfig[r.status] ?? statusConfig.PENDING
          const StatusIcon = cfg.icon
          return (
            <div
              key={r.id}
              className="flex items-center gap-3 border-b bg-card p-4 last:border-b-0 cursor-pointer"
              onClick={() => setSelectedReturn(r)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">{r.returnCode}</span>
                  <Badge variant="secondary" className={`gap-1 text-xs ${cfg.className}`}>
                    <StatusIcon className="size-3" />
                    {statusLabels[r.status] ?? r.status}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString()}
                  {r.originalOrderPublicId && ` · ${r.originalOrderPublicId}`}
                </p>
              </div>
              <span className="font-mono text-sm font-semibold shrink-0">{formatCurrency(r.totalRefund)}</span>
            </div>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden rounded-lg border sm:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">{tr.colReturnCode}</TableHead>
              <TableHead>{tr.colOriginalOrder}</TableHead>
              <TableHead>{tr.colDate}</TableHead>
              <TableHead>{tr.colStatus}</TableHead>
              <TableHead className="pr-4 text-right">{tr.colRefund}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReturns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                  {tr.noReturns}
                </TableCell>
              </TableRow>
            ) : (
              filteredReturns.map(r => {
                const cfg = statusConfig[r.status] ?? statusConfig.PENDING
                const StatusIcon = cfg.icon
                return (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelectedReturn(r)}>
                    <TableCell className="pl-4 font-mono text-sm font-medium">{r.returnCode}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {r.originalOrderPublicId ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`gap-1.5 ${cfg.className}`}>
                        <StatusIcon className="size-3" />
                        {statusLabels[r.status] ?? r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4 text-right font-mono text-sm font-medium">
                      {formatCurrency(r.totalRefund)}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <TableFooter filtered={filteredReturns.length} total={returns.length} label={tr.returns} />

      {/* Detail Modal */}
      <Dialog open={!!selectedReturn} onOpenChange={open => { if (!open) setSelectedReturn(null) }}>
        <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl">
          {selectedReturn && (
            <>
              <DialogHeader className="border-b px-6 py-4">
                <div className="flex items-center gap-4">
                  <DialogTitle className="font-mono text-lg">{selectedReturn.returnCode}</DialogTitle>
                  {(() => {
                    const cfg = statusConfig[selectedReturn.status] ?? statusConfig.PENDING
                    const StatusIcon = cfg.icon
                    return (
                      <Badge variant="secondary" className={`gap-1.5 ${cfg.className}`}>
                        <StatusIcon className="size-3" />
                        {statusLabels[selectedReturn.status] ?? selectedReturn.status}
                      </Badge>
                    )
                  })()}
                </div>
              </DialogHeader>

              <div className="space-y-6 p-6">
                {/* Info grid */}
                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">{tr.modalOriginalOrder}</p>
                    <p className="mt-1 font-mono">{selectedReturn.originalOrderPublicId ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{tr.modalWarehouse}</p>
                    <p className="mt-1">
                      {warehouses.find(w => w.id === selectedReturn.warehousePublicId)?.name ?? selectedReturn.warehousePublicId ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{tr.modalReason}</p>
                    <p className="mt-1">{selectedReturn.reason}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{tr.modalRefundMethod}</p>
                    <p className="mt-1">{selectedReturn.refundMethod}</p>
                  </div>
                </div>

                <Separator />

                {/* Items */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {tr.modalItems}
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
                            <TableHead className="pl-4">{tr.modalProduct}</TableHead>
                            <TableHead className="text-center">{tr.modalQty}</TableHead>
                            <TableHead className="text-right">{tr.modalPrice}</TableHead>
                            <TableHead className="pr-4 text-right">{tr.modalTotal}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(displayReturn?.items ?? []).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="h-16 text-center text-sm text-muted-foreground">—</TableCell>
                            </TableRow>
                          ) : (
                            (displayReturn?.items ?? []).map((item, idx) => (
                              <TableRow key={idx} className="hover:bg-transparent">
                                <TableCell className="pl-4 text-sm font-medium">{item.productName}</TableCell>
                                <TableCell className="text-center text-sm">{item.quantity}</TableCell>
                                <TableCell className="text-right font-mono text-sm">{formatCurrency(item.unitPrice)}</TableCell>
                                <TableCell className="pr-4 text-right font-mono text-sm font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between text-sm font-semibold">
                  <span>{tr.modalRefundTotal}</span>
                  <span className="font-mono text-base">{formatCurrency(selectedReturn.totalRefund)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
                {selectedReturn.status === 'PENDING' && (
                  <>
                    <Button
                      variant="outline"
                      className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-600"
                      onClick={handleCancel}
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                      {tr.cancelReturn}
                    </Button>
                    <Button className="gap-2" onClick={handleComplete} disabled={isActionLoading}>
                      {isActionLoading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                      {tr.completeReturn}
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Modal */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={open => {
          if (!open) { setIsCreateOpen(false); setCreateError(null); setCreateForm(defaultCreateForm); setCreateItems([emptyItem()]) }
        }}
      >
        <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="size-5" />
              {tr.createTitle}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Return Code */}
              <div className="space-y-2">
                <Label>{tr.returnCodeLabel}</Label>
                <Input
                  placeholder="RO-001"
                  value={createForm.returnCode}
                  onChange={e => setCreateForm(f => ({ ...f, returnCode: e.target.value }))}
                />
              </div>

              {/* Original Order */}
              <div className="space-y-2">
                <Label>{tr.originalOrderLabel}</Label>
                <Select
                  value={createForm.originalOrderPublicId || 'none'}
                  onValueChange={v => setCreateForm(f => ({ ...f, originalOrderPublicId: v === 'none' ? '' : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tr.selectOrder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{tr.noOrder}</SelectItem>
                    {orders.map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.orderCode}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Warehouse */}
            <div className="space-y-2">
              <Label>{tr.warehouseLabel} *</Label>
              <Select
                value={createForm.warehousePublicId}
                onValueChange={v => setCreateForm(f => ({ ...f, warehousePublicId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tr.selectWarehouse} />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Reason */}
              <div className="space-y-2">
                <Label>{tr.reasonLabel} *</Label>
                <Input
                  placeholder={tr.reasonPlaceholder}
                  value={createForm.reason}
                  onChange={e => setCreateForm(f => ({ ...f, reason: e.target.value }))}
                />
              </div>

              {/* Refund Method */}
              <div className="space-y-2">
                <Label>{tr.refundMethodLabel}</Label>
                <Select
                  value={createForm.refundMethod}
                  onValueChange={v => setCreateForm(f => ({ ...f, refundMethod: v as typeof createForm.refundMethod }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">{tr.refundMethodCash}</SelectItem>
                    <SelectItem value="BANK_TRANSFER">{tr.refundMethodTransfer}</SelectItem>
                    <SelectItem value="STORE_CREDIT">{tr.refundMethodCredit}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label>{tr.noteLabel}</Label>
              <Input
                value={createForm.note}
                onChange={e => setCreateForm(f => ({ ...f, note: e.target.value }))}
              />
            </div>

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{tr.itemsLabel} *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateItems(items => [...items, emptyItem()])}
                >
                  <Plus className="mr-1 size-3" />
                  {tr.addItem}
                </Button>
              </div>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">{tr.modalProduct}</TableHead>
                      <TableHead className="w-24">{tr.modalQty}</TableHead>
                      <TableHead className="w-32">{tr.modalPrice}</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {createItems.map((item, idx) => (
                      <TableRow key={idx} className="hover:bg-transparent">
                        <TableCell className="pl-4">
                          <Select
                            value={item.productPublicId}
                            onValueChange={v => {
                              const p = products.find(p => p.id === v)
                              updateItem(idx, { productPublicId: v, unitPrice: p?.sellingPrice ?? 0 })
                            }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder={tr.selectProduct} />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={e => updateItem(idx, { quantity: Number(e.target.value) })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={item.unitPrice}
                            onChange={e => updateItem(idx, { unitPrice: Number(e.target.value) })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          {createItems.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-red-600"
                              onClick={() => setCreateItems(items => items.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {createError && (
              <p className="text-sm text-red-500">{createError}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => { setIsCreateOpen(false); setCreateError(null); setCreateForm(defaultCreateForm); setCreateItems([emptyItem()]) }}
              disabled={isCreateLoading}
            >
              {t.common.cancel}
            </Button>
            <Button onClick={handleCreate} disabled={isCreateLoading || !isCreateValid}>
              {isCreateLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isCreateLoading ? tr.creating : tr.createReturn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
