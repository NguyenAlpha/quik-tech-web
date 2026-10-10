"use client"

import { Suspense, useState, useMemo, useEffect } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import { useNotificationCopy } from '@/lib/notification-copy'
import { toast } from 'sonner'
import { useLanguage } from "@/lib/language-context"
import { getInventoryItems, getWarehouses, adjustInventory, exportInventoryExcel } from "@/lib/api"
import { errorMessage } from '@/lib/api-error'
import { useRateLimitCooldown } from '@/hooks/use-rate-limit-cooldown'
import { InventoryTable } from "@/components/inventory-table"
import { BulkAdjustModal } from "@/components/bulk-adjust-modal"
import { BulkTransferModal } from "@/components/bulk-transfer-modal"
import { PageSkeleton } from "@/components/page-skeleton"
import { PageError } from "@/components/page-error"
import {
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  Minus,
  ArrowRightLeft,
  Download,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { TableFooter } from "@/components/table-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { InventoryItem, Warehouse } from "@/lib/types"

function getStockStatus(item: InventoryItem) {
  if (item.quantity === 0) return "critical"
  return "normal"
}

export default function InventoryPage() {
  return <Suspense fallback={<PageSkeleton />}><InventoryPageContent /></Suspense>
}

function InventoryPageContent() {
  const focusedItem = useSearchParams().get('item')
  const router = useRouter()
  const notificationCopy = useNotificationCopy()
  const { t } = useLanguage()
  const ti = t.inventory
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all")
  const [adjustmentModal, setAdjustmentModal] = useState<{
    open: boolean
    item: InventoryItem | null
    type: "add" | "remove"
  }>({ open: false, item: null, type: "add" })
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("")
  const [adjustmentReason, setAdjustmentReason] = useState("")
  const [adjusting, setAdjusting] = useState(false)
  const [adjustError, setAdjustError] = useState<string | null>(null)
  const [isBulkTransferOpen, setIsBulkTransferOpen] = useState(false)
  const [isBulkAdjustOpen, setIsBulkAdjustOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const exportCooldown = useRateLimitCooldown()
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)

  const init = async () => {
    setIsPageLoading(true)
    setPageError(null)
    try {
      const [items, whs] = await Promise.all([getInventoryItems(), getWarehouses()])
      setInventoryData(items)
      setWarehouses(whs)
    } catch (err) {
      setPageError(errorMessage(err, t))
    } finally {
      setIsPageLoading(false)
    }
  }

  useEffect(() => { init() }, [])
  useEffect(() => { setSearchQuery(''); setWarehouseFilter('all') }, [focusedItem])

  const filteredInventory = useMemo(() => {
    return inventoryData.filter((item) => {
      const matchesSearch =
        item.productName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesWarehouse =
        warehouseFilter === "all" || item.warehouseName === warehouseFilter
      return matchesSearch && matchesWarehouse && (!focusedItem || item.id === focusedItem)
    })
  }, [searchQuery, warehouseFilter, inventoryData, focusedItem])

  const openAdjustmentModal = (item: InventoryItem, type: "add" | "remove") => {
    setAdjustmentModal({ open: true, item, type })
    setAdjustmentQuantity("")
    setAdjustmentReason("")
    setAdjustError(null)
  }

  const closeAdjustmentModal = () => {
    setAdjustmentModal({ open: false, item: null, type: "add" })
    setAdjustmentQuantity("")
    setAdjustmentReason("")
    setAdjustError(null)
  }

  const handleAdjustment = async () => {
    if (!adjustmentModal.item || !adjustmentQuantity || parseInt(adjustmentQuantity) <= 0) return
    const delta = adjustmentModal.type === "add"
      ? parseInt(adjustmentQuantity)
      : -parseInt(adjustmentQuantity)
    setAdjusting(true)
    setAdjustError(null)
    try {
      await adjustInventory(
        adjustmentModal.item.productPublicId,
        adjustmentModal.item.warehousePublicId,
        delta,
        adjustmentReason.trim() || undefined,
      )
      const updated = await getInventoryItems()
      setInventoryData(updated)
      closeAdjustmentModal()
      toast.success(ti.adjustSuccess)
    } catch (err) {
      setAdjustError(errorMessage(err, t, ti.adjustError))
    } finally {
      setAdjusting(false)
    }
  }

  if (isPageLoading) return <PageSkeleton />
  if (pageError) return <PageError message={pageError} onRetry={init} />

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-10">
      {/* Page Header */}
      <PageHeader title={ti.title} subtitle={ti.subtitle}>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 shadow-sm"
            disabled={isExporting || exportCooldown.isCoolingDown}
            onClick={async () => {
              if (isExporting || exportCooldown.isCoolingDown) return
              setIsExporting(true)
              try {
                await exportInventoryExcel()
                toast.success(ti.exportSuccess)
              } catch (err) {
                exportCooldown.record(err)
                toast.error(errorMessage(err, t, ti.exportError))
              } finally {
                setIsExporting(false)
              }
            }}
          >
            <Download className="size-4" />
            {isExporting ? ti.exporting : exportCooldown.isCoolingDown ? t.common.retryIn.replace('{seconds}', String(exportCooldown.remainingSeconds)) : ti.exportExcel}
          </Button>
          <Button
            variant="outline"
            className="gap-2 shadow-sm"
            onClick={() => setIsBulkTransferOpen(true)}
          >
            <ArrowRightLeft className="size-4" />
            {ti.transferStock}
          </Button>
          <Button
            className="gap-2 shadow-sm"
            onClick={() => setIsBulkAdjustOpen(true)}
          >
            <ArrowUpCircle className="size-4" />
            {ti.adjustStock}
          </Button>
        </div>
      </PageHeader>

      {focusedItem && <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
        <p>{inventoryData.find(item => item.id === focusedItem)?.productName ?? notificationCopy.missingInventory}</p>
        <Button variant="outline" size="sm" onClick={() => router.replace('/inventory', { scroll: false })}>{notificationCopy.clearFilter}</Button>
      </div>}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={ti.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[200px]">
            <SelectValue placeholder={ti.filterByWarehouse} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ti.allWarehouses}</SelectItem>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.name}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Table */}
      <InventoryTable items={filteredInventory} onAdjust={openAdjustmentModal} />

      {/* Table Footer */}
      <TableFooter filtered={filteredInventory.length} total={inventoryData.length} label={ti.items}>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-red-500" />
          <span className="text-xs">
            {inventoryData.filter((i) => i.quantity === 0).length}{" "}
            {ti.lowStockCount}
          </span>
        </div>
      </TableFooter>

      {isBulkAdjustOpen && (
        <BulkAdjustModal
          warehouses={warehouses}
          inventory={inventoryData}
          onOpenChange={setIsBulkAdjustOpen}
          onAdjusted={async () => setInventoryData(await getInventoryItems())}
        />
      )}

      {isBulkTransferOpen && (
        <BulkTransferModal
          warehouses={warehouses}
          inventory={inventoryData}
          onOpenChange={setIsBulkTransferOpen}
          onTransferred={async () => setInventoryData(await getInventoryItems())}
        />
      )}

      {/* Stock Adjustment Modal */}
      <Dialog open={adjustmentModal.open} onOpenChange={closeAdjustmentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {adjustmentModal.type === "add" ? (
                <ArrowUpCircle className="size-5 text-emerald-600" />
              ) : (
                <ArrowDownCircle className="size-5 text-red-600" />
              )}
              {adjustmentModal.type === "add" ? ti.modalAddTitle : ti.modalRemoveTitle}
            </DialogTitle>
            <DialogDescription>
              {adjustmentModal.type === "add" ? ti.modalAddDesc : ti.modalRemoveDesc}
            </DialogDescription>
          </DialogHeader>

          {adjustmentModal.item && (
            <div className="space-y-6 py-4">
              {/* Product Info */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">
                    {adjustmentModal.item.productName}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {adjustmentModal.item.productPublicId}
                  </span>
                </div>
                <Separator className="my-3" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{ti.currentStock}</span>
                  <span className="font-mono font-semibold">
                    {adjustmentModal.item.quantity.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{ti.colWarehouse}</span>
                  <span>{adjustmentModal.item.warehouseName}</span>
                </div>
              </div>

              {/* Adjustment Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    {adjustmentModal.type === "add" ? ti.quantityToAdd : ti.quantityToRemove}
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="Enter quantity"
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">{ti.reason}</Label>
                  <Input
                    id="reason"
                    placeholder={
                      adjustmentModal.type === "add"
                        ? ti.reasonAddPlaceholder
                        : ti.reasonRemovePlaceholder
                    }
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              {/* Error */}
              {adjustError && (
                <p className="text-sm text-red-500">{adjustError}</p>
              )}

              {/* New Total Preview */}
              {adjustmentQuantity && parseInt(adjustmentQuantity) > 0 && (
                <div className="rounded-lg border border-dashed p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{ti.newTotal}</span>
                    <span
                      className={`font-mono text-lg font-semibold ${
                        adjustmentModal.type === "add"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {adjustmentModal.type === "add"
                        ? (
                            adjustmentModal.item.quantity +
                            parseInt(adjustmentQuantity)
                          ).toLocaleString()
                        : Math.max(
                            0,
                            adjustmentModal.item.quantity -
                              parseInt(adjustmentQuantity)
                          ).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeAdjustmentModal} disabled={adjusting}>
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleAdjustment}
              disabled={!adjustmentQuantity || parseInt(adjustmentQuantity) <= 0 || adjusting}
              className={
                adjustmentModal.type === "add"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {adjusting ? ti.adjusting : adjustmentModal.type === "add" ? (
                <>
                  <ArrowUpCircle className="mr-2 size-4" />
                  {ti.addStock}
                </>
              ) : (
                <>
                  <Minus className="mr-2 size-4" />
                  {ti.removeStock}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
