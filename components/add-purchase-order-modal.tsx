'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/lib/language-context'
import { CreatePurchaseOrderInput, Supplier, Product, PurchaseOrderItem } from '@/lib/types'

interface AddPurchaseOrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreatePurchaseOrderInput) => Promise<void>
  suppliers: Supplier[]
  products: Product[]
  isLoading?: boolean
}

export function AddPurchaseOrderModal({
  open,
  onOpenChange,
  onSubmit,
  suppliers,
  products,
  isLoading = false,
}: AddPurchaseOrderModalProps) {
  const { t } = useLanguage()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [items, setItems] = useState<Omit<PurchaseOrderItem, 'id'>[]>([])
  const [formData, setFormData] = useState({
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    status: 'pending' as const,
    notes: '',
  })

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.supplierId) newErrors.supplierId = 'Supplier is required'
    if (!formData.expectedDeliveryDate) newErrors.expectedDeliveryDate = 'Delivery date is required'
    if (items.length === 0) newErrors.items = 'At least one item is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        productId: '',
        productName: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      },
    ])
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
        ...formData,
        items,
      })
      setFormData({
        supplierId: '',
        orderDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: '',
        status: 'pending',
        notes: '',
      })
      setItems([])
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
              <Select value={formData.supplierId} onValueChange={(value) => setFormData({ ...formData, supplierId: value })}>
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
              {errors.supplierId && <p className="text-sm text-red-500">{errors.supplierId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderDate">{t.purchaseOrders.orderDate}</Label>
              <Input
                id="orderDate"
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedDeliveryDate">{t.purchaseOrders.expectedDeliveryDate}</Label>
              <Input
                id="expectedDeliveryDate"
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
              />
              {errors.expectedDeliveryDate && <p className="text-sm text-red-500">{errors.expectedDeliveryDate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t.purchaseOrders.status}</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t.purchaseOrders.pending}</SelectItem>
                  <SelectItem value="received">{t.purchaseOrders.received}</SelectItem>
                  <SelectItem value="completed">{t.purchaseOrders.completed}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t.purchaseOrders.notes}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                    value={item.productId}
                    onValueChange={(value) => {
                      const product = products.find((p) => p.id === value)
                      if (product) {
                        handleItemChange(index, 'productId', value)
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
