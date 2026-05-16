'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useLanguage } from '@/lib/language-context'
import { Category, Unit, CreateProductInput } from '@/lib/types'
import { getCategories, getUnits } from '@/lib/api'

interface AddProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateProductInput) => Promise<void>
  isLoading: boolean
}

export function AddProductModal({ open, onOpenChange, onSubmit, isLoading }: AddProductModalProps) {
  const { t } = useLanguage()
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
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
    const loadData = async () => {
      const [catsData, unitsData] = await Promise.all([getCategories(), getUnits()])
      setCategories(catsData)
      setUnits(unitsData)
    }
    loadData()
  }, [])

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

    try {
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

      setFormData({
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
      setErrors({})
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.products.addNewProduct}</DialogTitle>
          <DialogDescription>{t.products.subtitle}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SKU */}
          <div className="grid gap-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              placeholder="e.g., PROD-001"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>

          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="name">{t.products.productName}</Label>
            <Input
              id="name"
              placeholder="e.g., Wireless Mouse"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">{t.products.description}</Label>
            <Textarea
              id="description"
              placeholder="Product description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="costPrice">{t.products.costPrice}</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                className={errors.costPrice ? 'border-red-500' : ''}
              />
              {errors.costPrice && <p className="text-sm text-red-500">{errors.costPrice}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sellingPrice">{t.products.sellingPrice}</Label>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                className={errors.sellingPrice ? 'border-red-500' : ''}
              />
              {errors.sellingPrice && <p className="text-sm text-red-500">{errors.sellingPrice}</p>}
            </div>
          </div>

          {/* Min Stock Level */}
          <div className="grid gap-2">
            <Label htmlFor="minStockLevel">{t.products.minimumStock}</Label>
            <Input
              id="minStockLevel"
              type="number"
              placeholder="0"
              value={formData.minStockLevel}
              onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
              className={errors.minStockLevel ? 'border-red-500' : ''}
            />
            {errors.minStockLevel && <p className="text-sm text-red-500">{errors.minStockLevel}</p>}
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category">{t.products.category}</Label>
              <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                <SelectTrigger className={errors.categoryId ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t.products.selectCategory} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="unit">{t.products.unit}</Label>
              <Select value={formData.unitId} onValueChange={(value) => setFormData({ ...formData, unitId: value })}>
                <SelectTrigger className={errors.unitId ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t.products.selectUnit} />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name} ({unit.abbreviation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unitId && <p className="text-sm text-red-500">{errors.unitId}</p>}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              {t.products.isActive}
            </Label>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-4">
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
