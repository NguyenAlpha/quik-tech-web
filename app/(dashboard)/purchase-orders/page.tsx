'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { TableFooter } from '@/components/table-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/lib/language-context'
import { AddPurchaseOrderModal } from '@/components/add-purchase-order-modal'
import { PurchaseOrdersTable } from '@/components/purchase-orders-table'
import { PurchaseOrder, CreatePurchaseOrderInput, Supplier, Product, Warehouse } from '@/lib/types'
import {
  getPurchaseOrders,
  createPurchaseOrder,
  deletePurchaseOrder,
  updatePurchaseOrderStatus,
  getSuppliers,
  getProducts,
  getWarehouses,
} from '@/lib/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function PurchaseOrdersPage() {
  const { t } = useLanguage()
  const tpo = t.purchaseOrders
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
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
        const [pos, sups, prods, whs] = await Promise.all([
          getPurchaseOrders(),
          getSuppliers(),
          getProducts(),
          getWarehouses(),
        ])
        setPurchaseOrders(pos)
        setSuppliers(sups)
        setProducts(prods)
        setWarehouses(whs)
      } catch (error) {
        console.error('Error loading data:', error)
        setErrorMessage('Failed to load data')
      } finally {
        setIsPageLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        po.orderCode.toLowerCase().includes(q) ||
        po.supplierPublicId.toLowerCase().includes(q)
      const matchesStatus =
        statusFilter === 'all' || po.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [purchaseOrders, searchQuery, statusFilter])

  const handleAddPurchaseOrder = async (data: CreatePurchaseOrderInput) => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const newPO = await createPurchaseOrder(data)
      setPurchaseOrders([...purchaseOrders, newPO])
      setSuccessMessage(tpo.poCreated)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error creating purchase order:', error)
      setErrorMessage(tpo.errorCreatingPO)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePurchaseOrder = async (id: string) => {
    setIsDeleting(id)
    setErrorMessage(null)
    try {
      await deletePurchaseOrder(id)
      setPurchaseOrders(purchaseOrders.filter((p) => p.id !== id))
      setSuccessMessage(tpo.poDeleted)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error deleting purchase order:', error)
      setErrorMessage(tpo.errorDeletingPO)
    } finally {
      setIsDeleting(null)
    }
  }

  const handleStatusChange = async (id: string, status: 'pending' | 'received' | 'completed') => {
    try {
      await updatePurchaseOrderStatus(id, status)
      setPurchaseOrders(purchaseOrders.map((po) =>
        po.id === id ? { ...po, status } : po
      ))
      setSuccessMessage(tpo.poUpdated)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error updating status:', error)
      setErrorMessage(tpo.errorUpdatingPO)
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
      <PageHeader title={tpo.title} subtitle={tpo.subtitle}>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-sm">
          <Plus className="size-4" />
          {tpo.addPurchaseOrder}
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
            placeholder={tpo.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[160px]">
            <SelectValue placeholder={tpo.allStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tpo.allStatus}</SelectItem>
            <SelectItem value="pending">{tpo.pending}</SelectItem>
            <SelectItem value="received">{tpo.received}</SelectItem>
            <SelectItem value="completed">{tpo.completed}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Purchase Orders Table */}
      <Card>
        <CardContent className="p-0">
          <PurchaseOrdersTable
            purchaseOrders={filteredPurchaseOrders}
            onDelete={handleDeletePurchaseOrder}
            onStatusChange={handleStatusChange}
            isDeleting={isDeleting}
          />
        </CardContent>
      </Card>

      {/* Table Footer */}
      <TableFooter filtered={filteredPurchaseOrders.length} total={purchaseOrders.length} label={tpo.purchaseOrders} />

      {/* Add Purchase Order Modal */}
      <AddPurchaseOrderModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleAddPurchaseOrder}
        suppliers={suppliers}
        products={products}
        warehouses={warehouses}
        isLoading={isLoading}
      />
    </div>
  )
}
