"use client"

import { useState, useMemo, useEffect } from "react"
import { toast } from 'sonner'
import { useLanguage } from "@/lib/language-context"
import { getInventoryItems, getWarehouses, adjustInventory, transferInventory, exportInventoryExcel, ApiError } from "@/lib/api"
import { InventoryTable } from "@/components/inventory-table"
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
  const [transferModal, setTransferModal] = useState<{ open: boolean; item: InventoryItem | null }>({ open: false, item: null })
  const [transferFromId, setTransferFromId] = useState('')
  const [transferToId, setTransferToId] = useState('')
  const [transferQty, setTransferQty] = useState('')
  const [transferNote, setTransferNote] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [transferError, setTransferError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
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
      setPageError(err instanceof ApiError ? err.message : 'Failed to load data')
    } finally {
      setIsPageLoading(false)
    }
  }

  useEffect(() => { init() }, [])

  const filteredInventory = useMemo(() => {
    return inventoryData.filter((item) => {
      const matchesSearch =
        item.productName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesWarehouse =
        warehouseFilter === "all" || item.warehouseName === warehouseFilter
      return matchesSearch && matchesWarehouse
    })
  }, [searchQuery, warehouseFilter, inventoryData])

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

  const openTransferModal = (item: InventoryItem) => {
    setTransferModal({ open: true, item })
    setTransferFromId(item.warehousePublicId)
    setTransferToId('')
    setTransferQty('')
    setTransferNote('')
    setTransferError(null)
  }

  const closeTransferModal = () => {
    setTransferModal({ open: false, item: null })
    setTransferError(null)
  }

  const handleTransfer = async () => {
    if (!transferModal.item || !transferToId || !transferQty || Number(transferQty) <= 0) return
    if (transferFromId === transferToId) {
      setTransferError(ti.sameWarehouseError)
      return
    }
    setTransferring(true)
    setTransferError(null)
    try {
      await transferInventory(
        transferModal.item.productPublicId,
        transferFromId,
        transferToId,
        Number(transferQty),
        transferNote.trim() || undefined,
      )
      const updated = await getInventoryItems()
      setInventoryData(updated)
      closeTransferModal()
      toast.success(ti.transferSuccess)
    } catch (err) {
      setTransferError(err instanceof Error ? err.message : ti.transferError)
    } finally {
      setTransferring(false)
    }
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
      setAdjustError(err instanceof Error ? err.message : ti.adjustError)
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
        <Button
          variant="outline"
          className="gap-2 shadow-sm"
          disabled={isExporting}
          onClick={async () => {
            setIsExporting(true)
            try {
              await exportInventoryExcel()
              toast.success(ti.exportSuccess)
            } catch {
              toast.error(ti.exportError)
            } finally {
              setIsExporting(false)
            }
          }}
        >
          <Download className="size-4" />
          {isExporting ? ti.exporting : ti.exportExcel}
        </Button>
        <Button
          variant="outline"
          className="gap-2 shadow-sm"
          onClick={() => {
            if (filteredInventory.length > 0) openTransferModal(filteredInventory[0])
          }}
        >
          <ArrowRightLeft className="size-4" />
          {ti.transferStock}
        </Button>
        <Button
          className="gap-2 shadow-sm"
          onClick={() => {
            if (filteredInventory.length > 0) {
              openAdjustmentModal(filteredInventory[0], "add")
            }
          }}
        >
          <ArrowUpCircle className="size-4" />
          {ti.adjustStock}
        </Button>
      </PageHeader>

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

      {/* Transfer Modal */}
      <Dialog open={transferModal.open} onOpenChange={closeTransferModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="size-5 text-blue-600" />
              {ti.modalTransferTitle}
            </DialogTitle>
            <DialogDescription>{ti.modalTransferDesc}</DialogDescription>
          </DialogHeader>

          {transferModal.item && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="font-medium">{transferModal.item.productName}</p>
                <p className="text-xs text-muted-foreground font-mono">{transferModal.item.productPublicId}</p>
              </div>

              <div className="space-y-2">
                <Label>{ti.fromWarehouse}</Label>
                <Select value={transferFromId} onValueChange={setTransferFromId}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{ti.toWarehouse}</Label>
                <Select value={transferToId} onValueChange={setTransferToId}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.filter(w => w.id !== transferFromId).map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{ti.quantityToTransfer}</Label>
                <Input
                  type="number"
                  min="1"
                  value={transferQty}
                  onChange={e => setTransferQty(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label>{ti.reason}</Label>
                <Input
                  value={transferNote}
                  onChange={e => setTransferNote(e.target.value)}
                  placeholder={ti.reasonAddPlaceholder}
                  className="h-10"
                />
              </div>

              {transferError && <p className="text-sm text-red-500">{transferError}</p>}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeTransferModal} disabled={transferring}>
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!transferToId || !transferQty || Number(transferQty) <= 0 || transferring}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {transferring ? ti.transferring : (
                <>
                  <ArrowRightLeft className="mr-2 size-4" />
                  {ti.transferStock}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
