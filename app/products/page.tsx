'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/language-context'
import { AddProductModal } from '@/components/add-product-modal'
import { ProductsTable } from '@/components/products-table'
import { Product, Category, Unit, CreateProductInput } from '@/lib/types'
import { getProducts, getCategories, getUnits, createProduct, deleteProduct } from '@/lib/api'
import { Plus } from 'lucide-react'

export default function ProductsPage() {
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, categoriesData, unitsData] = await Promise.all([
          getProducts(),
          getCategories(),
          getUnits(),
        ])
        setProducts(productsData)
        setCategories(categoriesData)
        setUnits(unitsData)
      } catch (error) {
        console.error('Error loading data:', error)
        setErrorMessage('Failed to load data')
      } finally {
        setIsPageLoading(false)
      }
    }

    loadData()
  }, [])

  const handleAddProduct = async (data: CreateProductInput) => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const newProduct = await createProduct(data)
      setProducts([...products, newProduct])
      setSuccessMessage(t.products.productAdded)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error adding product:', error)
      setErrorMessage(t.products.errorAddingProduct)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    setIsDeleting(id)
    setErrorMessage(null)
    try {
      await deleteProduct(id)
      setProducts(products.filter((p) => p.id !== id))
      setSuccessMessage(t.products.productDeleted)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error deleting product:', error)
      setErrorMessage(t.products.errorDeletingProduct)
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
            {t.products.title}
          </h1>
          <p className="text-base text-muted-foreground">
            {t.products.subtitle}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="size-4" />
          {t.products.addProduct}
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

      {/* Products Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium">
            {products.length} {t.products.title.toLowerCase()}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <ProductsTable
            products={products}
            categories={categories}
            units={units}
            onDelete={handleDeleteProduct}
            isDeleting={isDeleting}
          />
        </CardContent>
      </Card>

      {/* Add Product Modal */}
      <AddProductModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleAddProduct}
        isLoading={isLoading}
      />
    </div>
  )
}
