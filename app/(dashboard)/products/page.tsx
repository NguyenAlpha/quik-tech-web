'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/lib/language-context'
import { AddProductModal } from '@/components/add-product-modal'
import { ProductsTable } from '@/components/products-table'
import { Product, Category, Unit, CreateProductInput } from '@/lib/types'
import { getProducts, getCategories, getUnits, createProduct, deleteProduct } from '@/lib/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { TableFooter } from '@/components/table-footer'

export default function ProductsPage() {
  const { t } = useLanguage()
  const tp = t.products
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
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

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory =
        categoryFilter === 'all' || product.categoryId === categoryFilter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && product.isActive) ||
        (statusFilter === 'inactive' && !product.isActive)
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [products, searchQuery, categoryFilter, statusFilter])

  const handleAddProduct = async (data: CreateProductInput) => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const newProduct = await createProduct(data)
      setProducts([...products, newProduct])
      setSuccessMessage(tp.productAdded)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error adding product:', error)
      setErrorMessage(tp.errorAddingProduct)
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
      setSuccessMessage(tp.productDeleted)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error deleting product:', error)
      setErrorMessage(tp.errorDeletingProduct)
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
      <PageHeader title={tp.title} subtitle={tp.subtitle}>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-sm">
          <Plus className="size-4" />
          {tp.addProduct}
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
            placeholder={tp.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[180px]">
            <SelectValue placeholder={tp.allCategories} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tp.allCategories}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[160px]">
            <SelectValue placeholder={tp.allStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tp.allStatus}</SelectItem>
            <SelectItem value="active">{tp.active}</SelectItem>
            <SelectItem value="inactive">{tp.inactive}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <ProductsTable
            products={filteredProducts}
            categories={categories}
            units={units}
            onDelete={handleDeleteProduct}
            isDeleting={isDeleting}
          />
        </CardContent>
      </Card>

      {/* Table Footer */}
      <TableFooter filtered={filteredProducts.length} total={products.length} label={tp.products} />

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
