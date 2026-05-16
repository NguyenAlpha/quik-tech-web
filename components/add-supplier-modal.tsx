'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/lib/language-context'
import { CreateSupplierInput } from '@/lib/types'

interface AddSupplierModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateSupplierInput) => Promise<void>
  isLoading?: boolean
}

export function AddSupplierModal({ open, onOpenChange, onSubmit, isLoading = false }: AddSupplierModalProps) {
  const { t } = useLanguage()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreateSupplierInput>({
    name: '',
    phone: '',
    email: '',
    address: '',
  })

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      setFormData({ name: '', phone: '', email: '', address: '' })
      setErrors({})
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.suppliers.addNewSupplier}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t.suppliers.supplierName}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Supplier name"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t.suppliers.phone}</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+84 28 1234 5678"
            />
            {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t.suppliers.email}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@supplier.com"
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t.suppliers.address}</Label>
            <Input
              id="address"
              value={formData.address ?? ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Street address"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting || isLoading}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoading}>
            {isSubmitting || isLoading ? 'Saving...' : t.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
