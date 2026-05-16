'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { TableFooter } from '@/components/table-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/lib/language-context'
import { AddSupplierModal } from '@/components/add-supplier-modal'
import { SuppliersTable } from '@/components/suppliers-table'
import { Supplier, CreateSupplierInput } from '@/lib/types'
import { getSuppliers, createSupplier, deleteSupplier } from '@/lib/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function SuppliersPage() {
  const { t } = useLanguage()
  const ts = t.suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
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

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        supplier.name.toLowerCase().includes(q) ||
        supplier.email.toLowerCase().includes(q) ||
        supplier.phone.includes(q) ||
        supplier.city.toLowerCase().includes(q) ||
        supplier.contactPerson.toLowerCase().includes(q)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && supplier.isActive) ||
        (statusFilter === 'inactive' && !supplier.isActive)
      return matchesSearch && matchesStatus
    })
  }, [suppliers, searchQuery, statusFilter])

  const handleAddSupplier = async (data: CreateSupplierInput) => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const newSupplier = await createSupplier(data)
      setSuppliers([...suppliers, newSupplier])
      setSuccessMessage(ts.supplierAdded)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error adding supplier:', error)
      setErrorMessage(ts.errorAddingSupplier)
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
      setSuccessMessage(ts.supplierDeleted)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error deleting supplier:', error)
      setErrorMessage(ts.errorDeletingSupplier)
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
      <PageHeader title={ts.title} subtitle={ts.subtitle}>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-sm">
          <Plus className="size-4" />
          {ts.addSupplier}
        </Button>
      </PageHeader>

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

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={ts.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[160px]">
            <SelectValue placeholder={ts.allStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ts.allStatus}</SelectItem>
            <SelectItem value="active">{ts.active}</SelectItem>
            <SelectItem value="inactive">{ts.inactive}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardContent className="p-0">
          <SuppliersTable
            suppliers={filteredSuppliers}
            onDelete={handleDeleteSupplier}
            isDeleting={isDeleting}
          />
        </CardContent>
      </Card>

      {/* Table Footer */}
      <TableFooter filtered={filteredSuppliers.length} total={suppliers.length} label={ts.suppliers} />

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
