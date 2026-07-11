'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useLanguage } from '@/lib/language-context'
import { Product, Category, Unit, CreateProductInput } from '@/lib/types'

interface EditProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  categories: Category[]
  units: Unit[]
  onSubmit: (data: CreateProductInput) => Promise<void>
  isLoading: boolean
}

export function EditProductModal({ open, onOpenChange, product, categories, units, onSubmit, isLoading }: EditProductModalProps) {
  const { t } = useLanguage()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    costPrice: '',
    sellingPrice: '',
    minStockLevel: '',
    categoryId: '',
    unitId: '',
    isActive: true,
  })

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku,
        name: product.name,
        description: product.description,
        costPrice: String(product.costPrice),
        sellingPrice: String(product.sellingPrice),
        minStockLevel: String(product.minStockLevel),
        categoryId: product.categoryId,
        unitId: product.unitId,
        isActive: product.isActive,
      })
      setErrors({})
    }
  }, [product])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = t.products.nameRequired
    if (!formData.costPrice || parseFloat(formData.costPrice) <= 0) newErrors.costPrice = t.products.costPriceRequired
    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) newErrors.sellingPrice = t.products.sellingPriceRequired
    if (!formData.minStockLevel || parseInt(formData.minStockLevel) < 0) newErrors.minStockLevel = t.products.minimumStockRequired
    if (!formData.categoryId) newErrors.categoryId = t.products.categoryRequired
    if (!formData.unitId) newErrors.unitId = t.products.unitRequired
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    await onSubmit({
      sku: formData.sku,
      name: formData.name,
      description: formData.description,
      costPrice: parseFloat(formData.costPrice),
      sellingPrice: parseFloat(formData.sellingPrice),
      minStockLevel: parseInt(formData.minStockLevel),
      categoryId: formData.categoryId,
      unitId: formData.unitId,
      isActive: formData.isActive,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.products.editProduct}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="edit-sku">SKU</Label>
            <Input
              id="edit-sku"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-name">{t.products.productName}</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-description">{t.products.description}</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-costPrice">{t.products.costPrice}</Label>
              <Input
                id="edit-costPrice"
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                className={errors.costPrice ? 'border-red-500' : ''}
              />
              {errors.costPrice && <p className="text-sm text-red-500">{errors.costPrice}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-sellingPrice">{t.products.sellingPrice}</Label>
              <Input
                id="edit-sellingPrice"
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                className={errors.sellingPrice ? 'border-red-500' : ''}
              />
              {errors.sellingPrice && <p className="text-sm text-red-500">{errors.sellingPrice}</p>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-minStockLevel">{t.products.minimumStock}</Label>
            <Input
              id="edit-minStockLevel"
              type="number"
              value={formData.minStockLevel}
              onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
              className={errors.minStockLevel ? 'border-red-500' : ''}
            />
            {errors.minStockLevel && <p className="text-sm text-red-500">{errors.minStockLevel}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>{t.products.category}</Label>
              <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                <SelectTrigger className={errors.categoryId ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t.products.selectCategory} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId}</p>}
            </div>
            <div className="grid gap-2">
              <Label>{t.products.unit}</Label>
              <Select value={formData.unitId} onValueChange={(v) => setFormData({ ...formData, unitId: v })}>
                <SelectTrigger className={errors.unitId ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t.products.selectUnit} />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>{unit.name} ({unit.abbreviation})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unitId && <p className="text-sm text-red-500">{errors.unitId}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="edit-isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
            />
            <Label htmlFor="edit-isActive" className="cursor-pointer">{t.products.isActive}</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t.common.loading : t.common.save}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
