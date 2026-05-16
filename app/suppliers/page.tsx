'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/language-context'
import { AddSupplierModal } from '@/components/add-supplier-modal'
import { SuppliersTable } from '@/components/suppliers-table'
import { Supplier, CreateSupplierInput } from '@/lib/types'
import { getSuppliers, createSupplier, deleteSupplier } from '@/lib/api'

export default function SuppliersPage() {
  const { t } = useLanguage()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getSuppliers()
        setSuppliers(data)
      } catch (error) {
        console.error('Error loading suppliers:', error)
        setErrorMessage('Failed to load suppliers')
      } finally {
        setIsPageLoading(false)
      }
    }

    loadData()
  }, [])

  const handleAddSupplier = async (data: CreateSupplierInput) => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const newSupplier = await createSupplier(data)
      setSuppliers([...suppliers, newSupplier])
      setSuccessMessage(t.suppliers.supplierAdded)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error adding supplier:', error)
      setErrorMessage(t.suppliers.errorAddingSupplier)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSupplier = async (id: string) => {
    setIsDeleting(id)
    setErrorMessage(null)
    try {
      await deleteSupplier(id)
      setSuppliers(suppliers.filter((s) => s.id !== id))
      setSuccessMessage(t.suppliers.supplierDeleted)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error deleting supplier:', error)
      setErrorMessage(t.suppliers.errorDeletingSupplier)
    } finally {
      setIsDeleting(null)
    }
  }

  if (isPageLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">{t.common.loading}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 lg:p-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {t.suppliers.title}
          </h1>
          <p className="text-base text-muted-foreground">
            {t.suppliers.subtitle}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="size-4" />
          {t.suppliers.addSupplier}
        </Button>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      {/* Suppliers Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium">
            {suppliers.length} {t.suppliers.title.toLowerCase()}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <SuppliersTable
            suppliers={suppliers}
            onDelete={handleDeleteSupplier}
            isDeleting={isDeleting}
          />
        </CardContent>
      </Card>

      {/* Add Supplier Modal */}
      <AddSupplierModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleAddSupplier}
        isLoading={isLoading}
      />
    </div>
  )
}
