"use client"

import { useState, useMemo, useEffect } from "react"
import { getInventoryItems } from "@/lib/api"
import { InventoryTable } from "@/components/inventory-table"
import {
  Search,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react"
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
import type { InventoryItem } from "@/lib/types"

const warehouses = ["Main Warehouse", "East Distribution", "West Hub"]

function getStockStatus(item: InventoryItem) {
  if (item.quantity === 0) return "critical"
  if (item.quantity < item.minStock) return "low"
  if (item.quantity > item.maxStock * 0.8) return "high"
  return "normal"
}

export default function InventoryPage() {
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all")

  useEffect(() => {
    getInventoryItems().then(setInventoryData)
  }, [])
  const [stockFilter, setStockFilter] = useState<string>("all")
  const [adjustmentModal, setAdjustmentModal] = useState<{
    open: boolean
    item: InventoryItem | null
    type: "add" | "remove"
  }>({ open: false, item: null, type: "add" })
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("")
  const [adjustmentReason, setAdjustmentReason] = useState("")

  const filteredInventory = useMemo(() => {
    return inventoryData.filter((item) => {
      const matchesSearch =
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesWarehouse =
        warehouseFilter === "all" || item.warehouse === warehouseFilter
      const status = getStockStatus(item)
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "low" && (status === "low" || status === "critical")) ||
        (stockFilter === "normal" && status === "normal") ||
        (stockFilter === "high" && status === "high")
      return matchesSearch && matchesWarehouse && matchesStock
    })
  }, [searchQuery, warehouseFilter, stockFilter])

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Inventory
          </h1>
          <p className="text-base text-muted-foreground">
            Track stock levels across all warehouses
          </p>
        </div>
        <Button
          className="gap-2 shadow-sm"
          onClick={() => {
            if (filteredInventory.length > 0) {
              openAdjustmentModal(filteredInventory[0], "add")
            }
          }}
        >
          <ArrowUpCircle className="size-4" />
          Adjust Stock
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by warehouse" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Warehouses</SelectItem>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse} value={warehouse}>
                {warehouse}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[180px]">
            <SelectValue placeholder="Stock status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="low">Low / Critical</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">High Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Table */}
      <InventoryTable items={filteredInventory} onAdjust={openAdjustmentModal} />

      {/* Table Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Showing{" "}
          <span className="font-medium text-foreground">
            {filteredInventory.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">
            {inventoryData.length}
          </span>{" "}
          items
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-red-500" />
            <span className="text-xs">
              {
                inventoryData.filter(
                  (i) => getStockStatus(i) === "critical" || getStockStatus(i) === "low"
                ).length
              }{" "}
              low stock
            </span>
          </div>
        </div>
      </div>

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
              {adjustmentModal.type === "add" ? "Add Stock" : "Remove Stock"}
            </DialogTitle>
            <DialogDescription>
              {adjustmentModal.type === "add"
                ? "Increase stock quantity for this product"
                : "Decrease stock quantity for this product"}
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
                    {adjustmentModal.item.sku}
                  </span>
                </div>
                <Separator className="my-3" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Stock</span>
                  <span className="font-mono font-semibold">
                    {adjustmentModal.item.quantity.toLocaleString()}{" "}
                    {adjustmentModal.item.unit}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Warehouse</span>
                  <span>{adjustmentModal.item.warehouse}</span>
                </div>
              </div>

              {/* Adjustment Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity to {adjustmentModal.type}</Label>
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
                  <Label htmlFor="reason">Reason (optional)</Label>
                  <Input
                    id="reason"
                    placeholder={
                      adjustmentModal.type === "add"
                        ? "e.g., New shipment received"
                        : "e.g., Damaged goods, Returns"
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
                    <span className="text-sm text-muted-foreground">
                      New Total
                    </span>
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
                          ).toLocaleString()}{" "}
                      {adjustmentModal.item.unit}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeAdjustmentModal}>
              Cancel
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
                  <Plus className="mr-2 size-4" />
                  Add Stock
                </>
              ) : (
                <>
                  <Minus className="mr-2 size-4" />
                  Remove Stock
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
