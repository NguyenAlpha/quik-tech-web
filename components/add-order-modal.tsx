'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { Loader2, Plus, Scan, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'
import { toast } from 'sonner'
import { getProductBySku } from '@/lib/api'
import { BarcodeScanner } from '@/components/barcode-scanner'
import type { Customer, Warehouse, Product, CreateOrderInput } from '@/lib/types'

interface ItemDraft {
  productPublicId: string
  quantity: number
  unitPrice: number
  discount: number
  discountType: 'FIXED' | 'PERCENT'
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: CreateOrderInput) => void
  isLoading: boolean
  customers: Customer[]
  warehouses: Warehouse[]
  products: Product[]
}

const newItem = (): ItemDraft => ({
  productPublicId: '',
  quantity: 1,
  unitPrice: 0,
  discount: 0,
  discountType: 'FIXED',
})

export function AddOrderModal({ open, onOpenChange, onSubmit, isLoading, customers, warehouses, products }: Props) {
  const { t } = useLanguage()
  const to = t.orders

  const [customerId, setCustomerId] = useState('none')
  const [warehouseId, setWarehouseId] = useState('')
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED')
  const [tax, setTax] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<ItemDraft[]>([newItem()])
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const isPaidManual = useRef(false)

  const summary = useMemo(() => {
    const subtotal = items.reduce((sum, it) => {
      const base = it.unitPrice * it.quantity
      const lineTotal = it.discountType === 'FIXED'
        ? base - it.discount
        : base * (1 - it.discount / 100)
      return sum + Math.max(0, lineTotal)
    }, 0)
    const discountAmt = discountType === 'FIXED' ? discount : subtotal * discount / 100
    const total = subtotal - Math.max(0, discountAmt) + tax
    const debt = Math.max(0, total - paidAmount)
    return { subtotal, discountAmt, total, debt }
  }, [items, discount, discountType, tax, paidAmount])

  useEffect(() => {
    if (open) {
      setCustomerId('none')
      setWarehouseId(warehouses[0]?.id ?? '')
      setDiscount(0)
      setDiscountType('FIXED')
      setTax(0)
      setPaidAmount(0)
      setPaymentMethod('CASH')
      setNote('')
      setItems([newItem()])
      isPaidManual.current = false
    }
  }, [open, warehouses])

  useEffect(() => {
    if (!isPaidManual.current) {
      setPaidAmount(summary.total)
    }
  }, [summary.total])

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
          quantity: 1,
          unitPrice: product.sellingPrice,
          discount: 0,
          discountType: 'FIXED',
        }]
      })
    } catch {
      toast.error('Không tìm thấy sản phẩm với mã vạch này')
    }
  }

  const updateItem = (i: number, patch: Partial<ItemDraft>) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it))

  const onProductSelect = (i: number, pid: string) => {
    const p = products.find(p => p.id === pid)
    if (p) updateItem(i, { productPublicId: p.id, unitPrice: p.sellingPrice })
  }

  const isWalkIn = customerId === 'none'
  const canSubmit = warehouseId !== '' &&
    items.some(it => it.productPublicId && it.quantity > 0) &&
    paidAmount >= 0 &&
    paidAmount <= summary.total &&
    !(isWalkIn && summary.debt > 0)

  const handleSubmit = () => {
    onSubmit({
      customerPublicId: customerId === 'none' ? undefined : customerId,
      warehousePublicId: warehouseId,
      discount,
      discountType,
      tax,
      paidAmount: paidAmount > 0 ? paidAmount : undefined,
      paymentMethod,
      note: note.trim() || undefined,
      items: items
        .filter(it => it.productPublicId && it.quantity > 0)
        .map(it => ({
          productPublicId: it.productPublicId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discount: it.discount,
          discountType: it.discountType,
        })),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{to.createOrderTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Order header fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">{to.warehouseLabel}</label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder={to.selectWarehouse} />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">{to.selectCustomer}</label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{to.noCustomer}</SelectItem>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">{to.itemsLabel}</h4>
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
                  onClick={() => setItems(prev => [...prev, newItem()])}
                >
                  <Plus className="size-3.5" />
                  {to.addItem}
                </Button>
              </div>
            </div>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4 text-xs">{to.modalProduct}</TableHead>
                    <TableHead className="w-20 text-xs">{to.modalQty}</TableHead>
                    <TableHead className="w-28 text-xs">{to.modalPrice}</TableHead>
                    <TableHead className="w-40 text-xs">{to.modalDiscount}</TableHead>
                    <TableHead className="w-10 pr-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, i) => (
                    <TableRow key={i} className="hover:bg-transparent">
                      <TableCell className="pl-4">
                        <Select
                          value={item.productPublicId || '__none__'}
                          onValueChange={v => v !== '__none__' && onProductSelect(i, v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder={to.selectProduct} />
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
                          className="h-8 w-28 text-xs"
                          value={item.unitPrice}
                          onChange={e => updateItem(i, { unitPrice: Number(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            min={0}
                            className="h-8 w-16 text-xs"
                            value={item.discount}
                            onChange={e => updateItem(i, { discount: Number(e.target.value) })}
                          />
                          <Select
                            value={item.discountType}
                            onValueChange={v => updateItem(i, { discountType: v as 'FIXED' | 'PERCENT' })}
                          >
                            <SelectTrigger className="h-8 w-20 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FIXED">{to.fixedDiscount}</SelectItem>
                              <SelectItem value="PERCENT">{to.percentDiscount}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))}
                          >
                            <Trash2 className="size-3.5 text-red-500" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <Separator />

          {/* Order-level discount, tax, note */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{to.discountLabel}</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={e => setDiscount(Number(e.target.value))}
                />
                <Select value={discountType} onValueChange={v => setDiscountType(v as 'FIXED' | 'PERCENT')}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">{to.fixedDiscount}</SelectItem>
                    <SelectItem value="PERCENT">{to.percentDiscount}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{to.taxLabel}</label>
              <Input
                type="number"
                min={0}
                value={tax}
                onChange={e => setTax(Number(e.target.value))}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">{to.noteLabel}</label>
              <Input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{to.paidAmountLabel}</label>
              <Input
                type="number"
                min={0}
                value={paidAmount}
                onChange={e => {
                  isPaidManual.current = true
                  setPaidAmount(Number(e.target.value))
                }}
              />
              {isWalkIn && summary.debt > 0 && (
                <p className="text-xs text-destructive">{to.walkInDebtWarning}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{to.paymentMethodLabel}</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">{to.paymentMethodCash}</SelectItem>
                  <SelectItem value="TRANSFER">{to.paymentMethodTransfer}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Summary */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{to.modalSubtotal}</span>
              <span className="font-mono">{formatCurrency(summary.subtotal)}</span>
            </div>
            {summary.discountAmt > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{to.modalDiscount}</span>
                <span className="font-mono text-emerald-600">-{formatCurrency(summary.discountAmt)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{to.modalTax}</span>
                <span className="font-mono">{formatCurrency(tax)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>{to.modalTotal}</span>
              <span className="font-mono">{formatCurrency(summary.total)}</span>
            </div>
            {paidAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>{to.paidAmountLabel}</span>
                <span className="font-mono">{formatCurrency(paidAmount)}</span>
              </div>
            )}
            {paidAmount > 0 && (
              <div className="flex justify-between font-semibold text-orange-600">
                <span>{to.debtAmountLabel}</span>
                <span className="font-mono">{formatCurrency(summary.debt)}</span>
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
            {to.createOrder}
          </Button>
        </div>
      </DialogContent>
      <BarcodeScanner
        open={isScannerOpen}
        onScan={handleBarcodeScan}
        onClose={() => setIsScannerOpen(false)}
      />
    </Dialog>
  )
}
