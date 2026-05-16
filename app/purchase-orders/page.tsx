'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/language-context'
import { AddPurchaseOrderModal } from '@/components/add-purchase-order-modal'
import { PurchaseOrdersTable } from '@/components/purchase-orders-table'
import { PurchaseOrder, CreatePurchaseOrderInput, Supplier, Product } from '@/lib/types'
import {
  getPurchaseOrders,
  createPurchaseOrder,
  deletePurchaseOrder,
  updatePurchaseOrderStatus,
  getSuppliers,
  getProducts,
} from '@/lib/api'

export default function PurchaseOrdersPage() {
  const { t } = useLanguage()
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pos, sups, prods] = await Promise.all([
          getPurchaseOrders(),
          getSuppliers(),
          getProducts(),
        ])
        setPurchaseOrders(pos)
        setSuppliers(sups)
        setProducts(prods)
      } catch (error) {
        console.error('Error loading data:', error)
        setErrorMessage('Failed to load data')
      } finally {
        setIsPageLoading(false)
      }
    }

    loadData()
  }, [])

  const handleAddPurchaseOrder = async (data: CreatePurchaseOrderInput) => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const newPO = await createPurchaseOrder(data)
      setPurchaseOrders([...purchaseOrders, newPO])
      setSuccessMessage(t.purchaseOrders.poCreated)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error creating purchase order:', error)
      setErrorMessage(t.purchaseOrders.errorCreatingPO)
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
      setSuccessMessage(t.purchaseOrders.poDeleted)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error deleting purchase order:', error)
      setErrorMessage(t.purchaseOrders.errorDeletingPO)
    } finally {
      setIsDeleting(null)
    }
  }

  const handleStatusChange = async (id: string, status: 'pending' | 'received' | 'completed') => {
    try {
      await updatePurchaseOrderStatus(id, status)
      const updatedPOs = purchaseOrders.map((po) =>
        po.id === id ? { ...po, status } : po
      )
      setPurchaseOrders(updatedPOs)
      setSuccessMessage(t.purchaseOrders.poUpdated)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error updating status:', error)
      setErrorMessage(t.purchaseOrders.errorUpdatingPO)
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
            {t.purchaseOrders.title}
          </h1>
          <p className="text-base text-muted-foreground">
            {t.purchaseOrders.subtitle}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="size-4" />
          {t.purchaseOrders.addPurchaseOrder}
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

      {/* Purchase Orders Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium">
            {purchaseOrders.length} {t.purchaseOrders.title.toLowerCase()}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <PurchaseOrdersTable
            purchaseOrders={purchaseOrders}
            onDelete={handleDeletePurchaseOrder}
            onStatusChange={handleStatusChange}
            isDeleting={isDeleting}
          />
        </CardContent>
      </Card>

      {/* Add Purchase Order Modal */}
      <AddPurchaseOrderModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleAddPurchaseOrder}
        suppliers={suppliers}
        products={products}
        isLoading={isLoading}
      />
    </div>
  )
}
