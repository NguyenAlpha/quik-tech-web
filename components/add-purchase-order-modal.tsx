'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/lib/language-context'
import { CreatePurchaseOrderInput, Supplier, Product, Warehouse } from '@/lib/types'

interface LocalItem {
  productPublicId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface AddPurchaseOrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreatePurchaseOrderInput) => Promise<void>
  suppliers: Supplier[]
  products: Product[]
  warehouses: Warehouse[]
  isLoading?: boolean
}

export function AddPurchaseOrderModal({
  open,
  onOpenChange,
  onSubmit,
  suppliers,
  products,
  warehouses,
  isLoading = false,
}: AddPurchaseOrderModalProps) {
  const { t } = useLanguage()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [items, setItems] = useState<LocalItem[]>([])
  const [formData, setFormData] = useState({
    orderCode: '',
    supplierPublicId: '',
    warehousePublicId: '',
    note: '',
  })

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.supplierPublicId) newErrors.supplierPublicId = 'Supplier is required'
    if (!formData.warehousePublicId) newErrors.warehousePublicId = 'Warehouse is required'
    if (items.length === 0) newErrors.items = 'At least one item is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddItem = () => {
    setItems([...items, { productPublicId: '', productName: '', quantity: 1, unitPrice: 0, totalPrice: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items]
    const item = newItems[index] as any
    item[field] = value
    if (field === 'quantity' || field === 'unitPrice') {
      item.totalPrice = (item.quantity || 0) * (item.unitPrice || 0)
    }
    setItems(newItems)
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        ...(formData.orderCode ? { orderCode: formData.orderCode } : {}),
        supplierPublicId: formData.supplierPublicId,
        warehousePublicId: formData.warehousePublicId,
        note: formData.note || undefined,
        items: items.map((item) => ({
          productPublicId: item.productPublicId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      })
      setFormData({ orderCode: '', supplierPublicId: '', warehousePublicId: '', note: '' })
      setItems([])
      setErrors({})
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.purchaseOrders.addNewPurchaseOrder}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">{t.purchaseOrders.supplier}</Label>
              <Select value={formData.supplierPublicId} onValueChange={(value) => setFormData({ ...formData, supplierPublicId: value })}>
                <SelectTrigger id="supplier">
                  <SelectValue placeholder={t.suppliers.selectSupplier} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.supplierPublicId && <p className="text-sm text-red-500">{errors.supplierPublicId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse">Warehouse</Label>
              <Select value={formData.warehousePublicId} onValueChange={(value) => setFormData({ ...formData, warehousePublicId: value })}>
                <SelectTrigger id="warehouse">
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.warehousePublicId && <p className="text-sm text-red-500">{errors.warehousePublicId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderCode">Order Code (optional)</Label>
              <Input
                id="orderCode"
                value={formData.orderCode}
                onChange={(e) => setFormData({ ...formData, orderCode: e.target.value })}
                placeholder="Auto-generated if empty"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">{t.purchaseOrders.notes}</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Order notes..."
              rows={2}
            />
          </div>

          {/* Items Section */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{t.purchaseOrders.items}</h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                {t.purchaseOrders.addItem}
              </Button>
            </div>

            {errors.items && <p className="text-sm text-red-500">{errors.items}</p>}

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-5 gap-2 items-end border p-2 rounded">
                  <Select
                    value={item.productPublicId}
                    onValueChange={(value) => {
                      const product = products.find((p) => p.id === value)
                      if (product) {
                        handleItemChange(index, 'productPublicId', value)
                        handleItemChange(index, 'productName', product.name)
                        handleItemChange(index, 'unitPrice', product.costPrice)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                    placeholder="Qty"
                  />

                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    placeholder="Price"
                  />

                  <Input type="text" value={`$${item.totalPrice.toFixed(2)}`} disabled placeholder="Total" />

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(index)}
                  >
                    {t.purchaseOrders.removeItem}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting || isLoading}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoading}>
            {isSubmitting || isLoading ? 'Creating...' : t.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
