'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ArrowRight, Loader2, PackageOpen, Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ProductPicker } from '@/components/product-picker'
import { useLanguage } from '@/lib/language-context'
import { errorMessage } from '@/lib/api-error'
import { bulkTransferInventory, getProducts } from '@/lib/api'
import type { InventoryItem, Product, Warehouse } from '@/lib/types'

interface Row {
  product: Product
  value: string
}

interface Props {
  warehouses: Warehouse[]
  inventory: InventoryItem[]
  onOpenChange: (open: boolean) => void
  onTransferred: () => Promise<void>
}

// Mount only while open so each session starts with an empty list.
export function BulkTransferModal({ warehouses, inventory, onOpenChange, onTransferred }: Props) {
  const { t } = useLanguage()
  const ti = t.inventory
  const pickerLabels = t.purchaseOrders

  // Kho đích phải active (API chặn); kho nguồn được phép inactive để rút hàng ra trước khi xóa kho
  const activeWarehouses = warehouses.filter(w => w.isActive)
  const [products, setProducts] = useState<Product[]>([])
  const [fromId, setFromId] = useState(warehouses[0]?.id ?? '')
  const [toId, setToId] = useState(activeWarehouses.find(w => w.id !== warehouses[0]?.id)?.id ?? '')
  const [rows, setRows] = useState<Row[]>([])
  const [note, setNote] = useState('')
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getProducts().then(setProducts).catch(err => toast.error(errorMessage(err, t)))
  }, [])

  const stockIn = (warehouseId: string, productId: string) =>
    inventory.find(i => i.productPublicId === productId && i.warehousePublicId === warehouseId)?.quantity ?? 0

  // Chỉ cho chọn product còn tồn ở kho nguồn
  const pickableProducts = useMemo(
    () => products.filter(p => stockIn(fromId, p.id) > 0),
    [products, inventory, fromId]
  )

  const computed = rows.map(row => {
    const available = stockIn(fromId, row.product.id)
    const quantity = row.value.trim() === '' ? null : Number(row.value)
    const valid = quantity !== null && !Number.isNaN(quantity) && quantity > 0
    return {
      ...row,
      available,
      quantity: valid ? quantity : null,
      exceeds: valid && quantity > available,
      destinationAfter: valid ? stockIn(toId, row.product.id) + quantity : null,
    }
  })
  const transfers = computed.filter(r => r.quantity !== null)
  const hasExceeds = computed.some(r => r.exceeds)
  const canSubmit = !!fromId && !!toId && fromId !== toId && transfers.length > 0 && !hasExceeds && !submitting

  const addedProductIds = useMemo(() => new Set(rows.map(r => r.product.id)), [rows])

  const addProducts = (picked: Product[]) =>
    setRows(prev => [...prev, ...picked.filter(p => !addedProductIds.has(p.id)).map(product => ({ product, value: '' }))])

  const updateValue = (productId: string, value: string) =>
    setRows(prev => prev.map(r => r.product.id === productId ? { ...r, value } : r))

  const handleFromChange = (id: string) => {
    setFromId(id)
    if (id === toId) setToId('')
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await bulkTransferInventory(
        fromId,
        toId,
        transfers.map(r => ({ productPublicId: r.product.id, quantity: r.quantity! })),
        note.trim() || undefined,
      )
      toast.success(ti.bulkTransferSuccess.replace('{count}', String(transfers.length)))
      onOpenChange(false)
      // Đã lưu xong — lỗi khi tải lại không được báo thành "chuyển kho thất bại"
      onTransferred().catch(err => toast.error(errorMessage(err, t)))
    } catch (err) {
      setError(errorMessage(err, t, ti.transferError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ti.modalTransferTitle}</DialogTitle>
          <DialogDescription>{ti.bulkTransferDesc}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label>{ti.fromWarehouse}</Label>
            <Select value={fromId} onValueChange={handleFromChange}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder={ti.selectWarehouse} />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground sm:mb-3 sm:block" />
          <div className="flex-1 space-y-2">
            <Label>{ti.toWarehouse}</Label>
            <Select value={toId} onValueChange={setToId}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder={ti.selectWarehouse} />
              </SelectTrigger>
              <SelectContent>
                {activeWarehouses.filter(w => w.id !== fromId).map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="outline" className="gap-1.5" disabled={!fromId} onClick={() => setIsPickerOpen(true)}>
            <Plus className="size-4" />
            {pickerLabels.selectProducts}
          </Button>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">{ti.colProduct}</TableHead>
                <TableHead className="text-right">{ti.colAvailable}</TableHead>
                <TableHead className="w-32">{ti.colTransferQty}</TableHead>
                <TableHead className="text-right">{ti.colDestinationAfter}</TableHead>
                <TableHead className="w-12 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="h-28 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <PackageOpen className="size-6 opacity-50" />
                      <span className="text-sm">
                        {fromId && products.length > 0 && pickableProducts.length === 0 ? ti.noStockInSource : pickerLabels.noItemsSelected}
                      </span>
                      {pickableProducts.length > 0 && (
                        <Button type="button" variant="link" size="sm" onClick={() => setIsPickerOpen(true)}>
                          {pickerLabels.selectProducts}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {computed.map(row => (
                <TableRow key={row.product.id} className="hover:bg-transparent">
                  <TableCell className="pl-4">
                    <div className="min-w-[8rem] max-w-[16rem]">
                      <p className="truncate text-sm font-medium" title={row.product.name}>{row.product.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.product.sku} · {row.product.unitName}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">{row.available.toLocaleString()}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      max={row.available}
                      value={row.value}
                      onChange={e => updateValue(row.product.id, e.target.value)}
                      aria-label={`${ti.colTransferQty}: ${row.product.name}`}
                      aria-invalid={row.exceeds}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {row.exceeds ? (
                      <span className="text-xs text-red-500">{ti.exceedsAvailable}</span>
                    ) : row.destinationAfter === null || !toId ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {row.destinationAfter.toLocaleString()}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={`${pickerLabels.removeItem}: ${row.product.name}`}
                      onClick={() => setRows(prev => prev.filter(r => r.product.id !== row.product.id))}
                    >
                      <Trash2 className="size-3.5 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bulk-transfer-note">{ti.reason}</Label>
          <Input
            id="bulk-transfer-note"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="h-10"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t.common.cancel}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {ti.transferSelected.replace('{count}', String(transfers.length))}
          </Button>
        </div>
      </DialogContent>

      {isPickerOpen && (
        <ProductPicker
          products={pickableProducts}
          addedProductIds={addedProductIds}
          priceField="costPrice"
          onOpenChange={setIsPickerOpen}
          onAdd={addProducts}
        />
      )}
    </Dialog>
  )
}
