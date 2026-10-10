'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Info, Loader2, PackageOpen, Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
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
import { bulkAdjustInventory, getProducts } from '@/lib/api'
import type { InventoryItem, Product, Warehouse } from '@/lib/types'

type Mode = 'delta' | 'count'

interface Row {
  product: Product
  value: string
}

interface Props {
  warehouses: Warehouse[]
  inventory: InventoryItem[]
  onOpenChange: (open: boolean) => void
  onAdjusted: () => Promise<void>
}

// Mount only while open so each session starts with an empty list.
export function BulkAdjustModal({ warehouses, inventory, onOpenChange, onAdjusted }: Props) {
  const { t } = useLanguage()
  const ti = t.inventory
  const pickerLabels = t.purchaseOrders

  const [products, setProducts] = useState<Product[]>([])
  const [warehouseId, setWarehouseId] = useState(warehouses.find(w => w.isActive)?.id ?? warehouses[0]?.id ?? '')
  const [mode, setMode] = useState<Mode>('delta')
  const [rows, setRows] = useState<Row[]>([])
  const [note, setNote] = useState('')
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getProducts().then(setProducts).catch(err => toast.error(errorMessage(err, t)))
  }, [])

  const currentStock = (productId: string) =>
    inventory.find(i => i.productPublicId === productId && i.warehousePublicId === warehouseId)?.quantity ?? 0

  // Count mode: delta = counted − current, tính theo tồn kho đang hiển thị của kho được chọn
  const computed = rows.map(row => {
    const current = currentStock(row.product.id)
    const input = row.value.trim() === '' ? null : Number(row.value)
    const delta = input === null || Number.isNaN(input) ? null : mode === 'delta' ? input : input - current
    return { ...row, current, delta, newTotal: delta === null ? null : current + delta }
  })
  const changes = computed.filter(r => r.delta !== null && r.delta !== 0)
  const hasNegative = computed.some(r => r.newTotal !== null && r.newTotal < 0)

  const addedProductIds = useMemo(() => new Set(rows.map(r => r.product.id)), [rows])

  const addProducts = (picked: Product[]) =>
    setRows(prev => [...prev, ...picked.filter(p => !addedProductIds.has(p.id)).map(product => ({ product, value: '' }))])

  const updateValue = (productId: string, value: string) =>
    setRows(prev => prev.map(r => r.product.id === productId ? { ...r, value } : r))

  const handleSubmit = async () => {
    if (changes.length === 0 || hasNegative) return
    setSubmitting(true)
    setError(null)
    try {
      await bulkAdjustInventory(
        warehouseId,
        changes.map(r => ({ productPublicId: r.product.id, quantity: r.delta! })),
        note.trim() || undefined,
      )
      toast.success(ti.bulkAdjustSuccess.replace('{count}', String(changes.length)))
      onOpenChange(false)
      // Đã lưu xong — lỗi khi tải lại không được báo thành "điều chỉnh thất bại"
      onAdjusted().catch(err => toast.error(errorMessage(err, t)))
    } catch (err) {
      setError(errorMessage(err, t, ti.adjustError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ti.bulkAdjustTitle}</DialogTitle>
          <DialogDescription>{ti.bulkAdjustDesc}</DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            {ti.purchaseOrderHint}{' '}
            <Link href="/purchase-orders" className="font-medium text-primary underline-offset-4 hover:underline">
              {t.purchaseOrders.title}
            </Link>
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2 sm:w-60">
            <Label>{ti.colWarehouse}</Label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ToggleGroup
            type="single"
            variant="outline"
            value={mode}
            onValueChange={value => value && setMode(value as Mode)}
          >
            <ToggleGroupItem value="delta" className="px-3">{ti.modeDelta}</ToggleGroupItem>
            <ToggleGroupItem value="count" className="px-3">{ti.modeCount}</ToggleGroupItem>
          </ToggleGroup>
          <Button type="button" variant="outline" className="gap-1.5 sm:ml-auto" onClick={() => setIsPickerOpen(true)}>
            <Plus className="size-4" />
            {pickerLabels.selectProducts}
          </Button>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">{ti.colProduct}</TableHead>
                <TableHead className="text-right">{ti.currentStock}</TableHead>
                <TableHead className="w-36">{mode === 'delta' ? ti.colChange : ti.colCounted}</TableHead>
                <TableHead className="text-right">{ti.newTotal}</TableHead>
                <TableHead className="w-12 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="h-28 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <PackageOpen className="size-6 opacity-50" />
                      <span className="text-sm">{pickerLabels.noItemsSelected}</span>
                      <Button type="button" variant="link" size="sm" onClick={() => setIsPickerOpen(true)}>
                        {pickerLabels.selectProducts}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {computed.map(row => {
                const negative = row.newTotal !== null && row.newTotal < 0
                return (
                  <TableRow key={row.product.id} className="hover:bg-transparent">
                    <TableCell className="pl-4">
                      <div className="min-w-[8rem] max-w-[16rem]">
                        <p className="truncate text-sm font-medium" title={row.product.name}>{row.product.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{row.product.sku} · {row.product.unitName}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{row.current.toLocaleString()}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={mode === 'count' ? 0 : undefined}
                        value={row.value}
                        onChange={e => updateValue(row.product.id, e.target.value)}
                        placeholder={mode === 'delta' ? '+10 / -5' : String(row.current)}
                        aria-label={`${mode === 'delta' ? ti.colChange : ti.colCounted}: ${row.product.name}`}
                        aria-invalid={negative}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {row.newTotal === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : negative ? (
                        <span className="text-xs text-red-500">{ti.negativeStockRow}</span>
                      ) : (
                        <span className={`font-mono font-semibold ${row.delta! > 0 ? 'text-emerald-600 dark:text-emerald-400' : row.delta! < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                          {row.newTotal.toLocaleString()}
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
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bulk-adjust-note">{ti.reason}</Label>
          <Input
            id="bulk-adjust-note"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={ti.reasonRemovePlaceholder}
            className="h-10"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t.common.cancel}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={changes.length === 0 || hasNegative || submitting || !warehouseId}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {ti.adjustSelected.replace('{count}', String(changes.length))}
          </Button>
        </div>
      </DialogContent>

      {isPickerOpen && (
        <ProductPicker
          products={products}
          addedProductIds={addedProductIds}
          priceField="costPrice"
          onOpenChange={setIsPickerOpen}
          onAdd={addProducts}
        />
      )}
    </Dialog>
  )
}
