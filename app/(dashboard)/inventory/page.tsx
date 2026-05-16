"use client"

import { useState, useMemo, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { getInventoryItems, getWarehouses } from "@/lib/api"
import { InventoryTable } from "@/components/inventory-table"
import {
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  Minus,
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

  useEffect(() => {
    getInventoryItems().then(setInventoryData)
    getWarehouses().then(setWarehouses)
  }, [])

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
  }

  const closeAdjustmentModal = () => {
    setAdjustmentModal({ open: false, item: null, type: "add" })
    setAdjustmentQuantity("")
    setAdjustmentReason("")
  }

  const handleAdjustment = () => {
    // In a real app, this would make an API call
    closeAdjustmentModal()
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 lg:p-10">
      {/* Page Header */}
      <PageHeader title={ti.title} subtitle={ti.subtitle}>
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
            <Button variant="outline" onClick={closeAdjustmentModal}>
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleAdjustment}
              disabled={!adjustmentQuantity || parseInt(adjustmentQuantity) <= 0}
              className={
                adjustmentModal.type === "add"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {adjustmentModal.type === "add" ? (
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
