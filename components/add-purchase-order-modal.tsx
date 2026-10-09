'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
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
import { Loader2, PackageOpen, Plus, Scan, Search, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'
import { toast } from 'sonner'
import { getProductBySku } from '@/lib/api'
import { BarcodeScanner } from '@/components/barcode-scanner'
import type { Supplier, Warehouse, Product, CreatePurchaseOrderInput, PurchaseOrder } from '@/lib/types'

interface ItemDraft {
  productPublicId: string
  productName?: string
  quantity: number
  unitPrice: number
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: CreatePurchaseOrderInput) => Promise<void>
  isLoading?: boolean
  suppliers: Supplier[]
  warehouses: Warehouse[]
  products: Product[]
  initialData?: PurchaseOrder | null
}

export function AddPurchaseOrderModal({ open, onOpenChange, onSubmit, isLoading = false, suppliers, warehouses, products, initialData }: Props) {
  const { t } = useLanguage()
  const tpo = t.purchaseOrders
  const isEdit = !!initialData

  const [supplierId, setSupplierId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [paidAmount, setPaidAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<ItemDraft[]>([])
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
  const isPaidManual = useRef(false)

  const productById = useMemo(
    () => new Map(products.map(product => [product.id, product])),
    [products]
  )

  const addedProductIds = useMemo(
    () => new Set(items.map(item => item.productPublicId)),
    [items]
  )

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLocaleLowerCase()
    return products
      .filter(product => product.isActive)
      .filter(product => !query || [product.name, product.sku, product.categoryName]
        .some(value => value?.toLocaleLowerCase().includes(query)))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [productSearch, products])

  const total = useMemo(
    () => items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0),
    [items]
  )

  useEffect(() => {
    if (open) {
      if (initialData) {
        setSupplierId(initialData.supplierPublicId)
        setWarehouseId(initialData.warehousePublicId)
        setNote(initialData.note ?? '')
        setItems(
          initialData.items.map(it => ({
            productPublicId: it.productPublicId,
            productName: it.productName,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          }))
        )
        setPaidAmount(initialData.paidAmount)
        isPaidManual.current = true
      } else {
        setSupplierId('')
        setWarehouseId(warehouses[0]?.id ?? '')
        setPaidAmount(0)
        setPaymentMethod('CASH')
        setNote('')
        setItems([])
        isPaidManual.current = false
      }
    }
  }, [open, warehouses, initialData])

  useEffect(() => {
    if (!isPaidManual.current) setPaidAmount(total)
  }, [total])

  const debt = Math.max(0, total - paidAmount)

  const handleBarcodeScan = async (sku: string) => {
    try {
      const product = await getProductBySku(sku)
      setItems(prev => {
        const existing = prev.findIndex(it => it.productPublicId === product.id)
        if (existing >= 0) {
          return prev.map((it, idx) => idx === existing ? { ...it, quantity: it.quantity + 1 } : it)
        }
        return [...prev.filter(it => it.productPublicId !== ''), {
          productPublicId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.costPrice,
        }]
      })
    } catch {
      toast.error('Không tìm thấy sản phẩm với mã vạch này')
    }
  }

  const updateItem = (i: number, patch: Partial<ItemDraft>) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it))

  const openProductPicker = () => {
    setProductSearch('')
    setSelectedProductIds(new Set())
    setIsProductPickerOpen(true)
  }

  const toggleProductSelection = (productId: string, checked: boolean) => {
    setSelectedProductIds(previous => {
      const next = new Set(previous)
      if (checked) next.add(productId)
      else next.delete(productId)
      return next
    })
  }

  const addSelectedProducts = () => {
    const productsToAdd = products.filter(product => selectedProductIds.has(product.id))
    setItems(previous => {
      const existingIds = new Set(previous.map(item => item.productPublicId))
      const additions = productsToAdd
        .filter(product => !existingIds.has(product.id))
        .map(product => ({
          productPublicId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.costPrice,
        }))
      return [...previous, ...additions]
    })
    setIsProductPickerOpen(false)
  }

  const canSubmit = supplierId !== '' &&
    warehouseId !== '' &&
    items.some(it => it.productPublicId && it.quantity > 0) &&
    paidAmount >= 0 &&
    paidAmount <= total

  const handleSubmit = async () => {
    await onSubmit({
      supplierPublicId: supplierId,
      warehousePublicId: warehouseId,
      paidAmount: paidAmount > 0 ? paidAmount : undefined,
      paymentMethod,
      note: note.trim() || undefined,
      items: items
        .filter(it => it.productPublicId && it.quantity > 0)
        .map(it => ({
          productPublicId: it.productPublicId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{isEdit ? tpo.editPurchaseOrder : tpo.addNewPurchaseOrder}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Header fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">{tpo.warehouse}</label>
              <Select value={warehouseId} onValueChange={setWarehouseId} disabled={warehouses.length === 1}>
                <SelectTrigger><SelectValue placeholder={t.orders.selectWarehouse} /></SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">{tpo.supplier}</label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue placeholder={t.suppliers.selectSupplier} /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">{tpo.items}</h4>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setIsScannerOpen(true)}
                >
                  <Scan className="size-3.5" />
                  Quét mã
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={openProductPicker}
                >
                  <Plus className="size-3.5" />
                  {tpo.selectProducts}
                </Button>
              </div>
            </div>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4 text-xs">{tpo.product}</TableHead>
                    <TableHead className="w-20 text-xs">{tpo.quantity}</TableHead>
                    <TableHead className="w-32 text-xs">{tpo.unitPrice}</TableHead>
                    <TableHead className="w-10 pr-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={4} className="h-28 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <PackageOpen className="size-6 opacity-50" />
                          <span className="text-sm">{tpo.noItemsSelected}</span>
                          <Button type="button" variant="link" size="sm" onClick={openProductPicker}>
                            {tpo.selectProducts}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {items.map((item, i) => (
                    <TableRow key={`${item.productPublicId}-${i}`} className="hover:bg-transparent">
                      <TableCell className="pl-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {productById.get(item.productPublicId)?.name ?? item.productName ?? tpo.productUnavailable}
                          </p>
                          {productById.get(item.productPublicId) && (
                            <p className="truncate text-xs text-muted-foreground">
                              {productById.get(item.productPublicId)?.sku} · {productById.get(item.productPublicId)?.unitName}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0.01}
                          step={0.01}
                          className="h-8 w-20 text-xs"
                          value={item.quantity}
                          onChange={e => updateItem(i, { quantity: Number(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          className="h-8 w-32 text-xs"
                          value={item.unitPrice}
                          onChange={e => updateItem(i, { unitPrice: Number(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={tpo.removeItem}
                          onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 className="size-3.5 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <Separator />

          {/* Note + Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">{tpo.notes}</label>
              <Input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{tpo.paidAmount}</label>
              <Input
                type="number"
                min={0}
                value={paidAmount}
                onChange={e => {
                  isPaidManual.current = true
                  setPaidAmount(Number(e.target.value))
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{tpo.paymentMethodLabel}</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">{tpo.paymentMethodCash}</SelectItem>
                  <SelectItem value="TRANSFER">{tpo.paymentMethodTransfer}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Summary */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between font-semibold">
              <span>{tpo.total}</span>
              <span className="font-mono">{formatCurrency(total)}</span>
            </div>
            {paidAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>{tpo.paidAmount}</span>
                <span className="font-mono">{formatCurrency(paidAmount)}</span>
              </div>
            )}
            {debt > 0 && (
              <div className="flex justify-between font-semibold text-orange-600">
                <span>{tpo.remainingDebt}</span>
                <span className="font-mono">{formatCurrency(debt)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !canSubmit}>
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEdit ? t.common.save : tpo.addPurchaseOrder}
          </Button>
        </div>
      </DialogContent>
      <BarcodeScanner
        open={isScannerOpen}
        onScan={handleBarcodeScan}
        onClose={() => setIsScannerOpen(false)}
      />

      <Dialog open={isProductPickerOpen} onOpenChange={setIsProductPickerOpen}>
        <DialogContent className="flex max-h-[85vh] !max-w-2xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>{tpo.selectProducts}</DialogTitle>
            <DialogDescription>{tpo.selectProductsDescription}</DialogDescription>
          </DialogHeader>

          <div className="border-b p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={productSearch}
                onChange={event => setProductSearch(event.target.value)}
                className="pl-9"
                placeholder={tpo.searchProducts}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {filteredProducts.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
                <PackageOpen className="size-8 opacity-50" />
                <p className="text-sm">{tpo.noMatchingProducts}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredProducts.map(product => {
                  const alreadyAdded = addedProductIds.has(product.id)
                  const selected = selectedProductIds.has(product.id)
                  const checkboxId = `purchase-product-${product.id}`
                  return (
                    <label
                      key={product.id}
                      htmlFor={checkboxId}
                      className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${alreadyAdded ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-muted'}`}
                    >
                      <Checkbox
                        id={checkboxId}
                        checked={alreadyAdded || selected}
                        disabled={alreadyAdded}
                        onCheckedChange={checked => toggleProductSelection(product.id, checked === true)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{product.name}</p>
                          {alreadyAdded && (
                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                              {tpo.alreadyAdded}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {product.sku} · {product.categoryName} · {product.unitName}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-medium">{formatCurrency(product.costPrice)}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t px-6 py-4">
            <p className="text-sm text-muted-foreground">
              {selectedProductIds.size} {tpo.selectedProducts}
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setIsProductPickerOpen(false)}>
                {t.common.cancel}
              </Button>
              <Button type="button" disabled={selectedProductIds.size === 0} onClick={addSelectedProducts}>
                {tpo.addSelectedProducts}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
