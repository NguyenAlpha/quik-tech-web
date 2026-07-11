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
import type { Supplier, Warehouse, Product, CreatePurchaseOrderInput, PurchaseOrder } from '@/lib/types'

interface ItemDraft {
  productPublicId: string
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

const newItem = (): ItemDraft => ({ productPublicId: '', quantity: 1, unitPrice: 0 })

export function AddPurchaseOrderModal({ open, onOpenChange, onSubmit, isLoading = false, suppliers, warehouses, products, initialData }: Props) {
  const { t } = useLanguage()
  const tpo = t.purchaseOrders
  const isEdit = !!initialData

  const [supplierId, setSupplierId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [paidAmount, setPaidAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<ItemDraft[]>([newItem()])
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const isPaidManual = useRef(false)

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
          initialData.items.length > 0
            ? initialData.items.map(it => ({ productPublicId: it.productPublicId, quantity: it.quantity, unitPrice: it.unitPrice }))
            : [newItem()]
        )
        setPaidAmount(initialData.paidAmount)
        isPaidManual.current = true
      } else {
        setSupplierId('')
        setWarehouseId(warehouses[0]?.id ?? '')
        setPaidAmount(0)
        setPaymentMethod('CASH')
        setNote('')
        setItems([newItem()])
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

  const onProductSelect = (i: number, pid: string) => {
    const p = products.find(p => p.id === pid)
    if (p) updateItem(i, { productPublicId: p.id, unitPrice: p.costPrice })
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
                  onClick={() => setItems(prev => [...prev, newItem()])}
                >
                  <Plus className="size-3.5" />
                  {tpo.addItem}
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
                  {items.map((item, i) => (
                    <TableRow key={i} className="hover:bg-transparent">
                      <TableCell className="pl-4">
                        <Select
                          value={item.productPublicId || '__none__'}
                          onValueChange={v => v !== '__none__' && onProductSelect(i, v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder={tpo.selectProduct} />
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
                          className="h-8 w-32 text-xs"
                          value={item.unitPrice}
                          onChange={e => updateItem(i, { unitPrice: Number(e.target.value) })}
                        />
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
    </Dialog>
  )
}
