'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/lib/language-context'
import { AddProductModal } from '@/components/add-product-modal'
import { EditProductModal } from '@/components/edit-product-modal'
import { ProductsTable } from '@/components/products-table'
import { Product, Category, Unit, CreateProductInput } from '@/lib/types'
import { searchProducts, getCategories, getUnits, createProduct, updateProduct, setProductStatus, deleteProduct, importProducts, ApiError } from '@/lib/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Search, X, Upload, Download, Loader2, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { TableFooter } from '@/components/table-footer'
import { PageSkeleton } from '@/components/page-skeleton'

export default function ProductsPage() {
  const { t } = useLanguage()
  const tp = t.products
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [sortBy, setSortBy] = useState<'name' | 'updatedAt'>('updatedAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditLoading, setIsEditLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const hasLoaded = useRef(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([getCategories(), getUnits()])
      .then(([cats, uts]) => { setCategories(cats); setUnits(uts) })
      .catch(() => toast.error('Failed to load data'))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setPage(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const load = async () => {
      setIsPageLoading(true)
      try {
        const result = await searchProducts({
          q: debouncedQuery || undefined,
          isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
          categoryPublicId: categoryFilter === 'all' ? undefined : categoryFilter,
          page,
          size: 20,
          sortBy,
          sort: sortDir,
        })
        setProducts(result.content)
        setTotalPages(result.totalPages)
        setTotalElements(result.totalElements)
      } catch {
        toast.error('Failed to load products')
      } finally {
        setIsPageLoading(false)
        hasLoaded.current = true
      }
    }
    load()
  }, [debouncedQuery, categoryFilter, statusFilter, page, sortBy, sortDir, refreshKey])

  const handleAddProduct = async (data: CreateProductInput) => {
    setIsLoading(true)
    try {
      await createProduct(data)
      toast.success(tp.productAdded)
      setPage(0)
      setRefreshKey(k => k + 1)
    } catch (error) {
      // if(error.)
      toast.error(error instanceof ApiError ? error.message : tp.errorAddingProduct)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    setIsDeleting(id)
    try {
      await deleteProduct(id)
      toast.success(tp.productDeleted)
      setRefreshKey(k => k + 1)
    } catch (err) {
      // 400 VALIDATION_ERROR: backend chặn xóa sản phẩm còn tồn kho
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') {
        toast.error(tp.deleteBlockedHasStock)
      } else {
        toast.error(tp.errorDeletingProduct)
      }
    } finally {
      setIsDeleting(null)
    }
  }

  const handleEditProduct = async (data: CreateProductInput) => {
    if (!editingProduct) return
    setIsEditLoading(true)
    try {
      await updateProduct(editingProduct.id, data)
      toast.success(tp.productUpdated)
      setRefreshKey(k => k + 1)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : tp.errorUpdatingProduct)
    } finally {
      setIsEditLoading(false)
    }
  }

  const handleStatusChange = async (id: string, isActive: boolean) => {
    try {
      await setProductStatus(id, isActive)
      setRefreshKey(k => k + 1)
    } catch {
      toast.error(tp.errorUpdatingProduct)
    }
  }

  const handleImport = async () => {
    if (!importFile) return
    setIsImporting(true)
    setImportResult(null)
    try {
      const result = await importProducts(importFile)
      setImportResult(result)
      if (result.imported > 0) {
        toast.success(tp.importSuccess.replace('{imported}', String(result.imported)).replace('{skipped}', String(result.skipped)))
        setRefreshKey(k => k + 1)
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tp.importError)
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    const csv = 'sku,name,description,categoryName,unitName,costPrice,sellingPrice,minStockLevel,isActive\nSP001,Sample Product,,Electronics,Piece,10.00,15.00,5,true\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'products_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value)
    setPage(0)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setPage(0)
  }

  if (isPageLoading && !hasLoaded.current) return <PageSkeleton />

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-10">
      {/* Header */}
      <PageHeader title={tp.title} subtitle={tp.subtitle}>
        <Button variant="outline" onClick={() => { setImportOpen(true); setImportFile(null); setImportResult(null) }} className="gap-2 shadow-sm">
          <Upload className="size-4" />
          {tp.importProducts}
        </Button>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-sm">
          <Plus className="size-4" />
          {tp.addProduct}
        </Button>
      </PageHeader>

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
        <Select value={categoryFilter} onValueChange={handleCategoryChange}>
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
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="h-10 w-full sm:w-[160px]">
            <SelectValue placeholder={tp.allStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tp.allStatus}</SelectItem>
            <SelectItem value="active">{tp.active}</SelectItem>
            <SelectItem value="inactive">{tp.inactive}</SelectItem>
          </SelectContent>
        </Select>
        {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            className="w-fit gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setStatusFilter('all'); setPage(0) }}
          >
            <X className="size-3.5" />
            Reset filter
          </Button>
        )}
      </div>

      {/* Products Table */}
      <ProductsTable
        products={products}
        onDelete={handleDeleteProduct}
        onEdit={(product) => setEditingProduct(product)}
        onStatusChange={handleStatusChange}
        isDeleting={isDeleting}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={(dir) => {
          if (dir === null) { setSortBy('updatedAt'); setSortDir('desc') }
          else { setSortBy('name'); setSortDir(dir) }
          setPage(0)
        }}
      />

      {/* Table Footer */}
      <TableFooter filtered={products.length} total={totalElements} label={tp.products}>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0 || isPageLoading}
            >
              Previous
            </Button>
            <span className="text-sm">{page + 1} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1 || isPageLoading}
            >
              Next
            </Button>
          </div>
        )}
      </TableFooter>

      {/* Add Product Modal */}
      <AddProductModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleAddProduct}
        isLoading={isLoading}
        categories={categories}
        units={units}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        open={editingProduct !== null}
        onOpenChange={(open) => { if (!open) setEditingProduct(null) }}
        product={editingProduct}
        categories={categories}
        units={units}
        onSubmit={handleEditProduct}
        isLoading={isEditLoading}
      />

      {/* Import CSV Modal */}
      <Dialog open={importOpen} onOpenChange={open => { setImportOpen(open); if (!open) { setImportFile(null); setImportResult(null) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="size-5" />
              {tp.importModalTitle}
            </DialogTitle>
            <DialogDescription>{tp.importModalDesc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => setImportFile(e.target.files?.[0] ?? null)}
            />
            <div
              className="cursor-pointer rounded-lg border-2 border-dashed border-muted-foreground/30 p-8 text-center hover:border-muted-foreground/60 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto mb-2 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {importFile ? importFile.name : tp.importDropzone}
              </p>
            </div>

            {importResult && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-emerald-600">
                  {tp.importSuccess.replace('{imported}', String(importResult.imported)).replace('{skipped}', String(importResult.skipped))}
                </p>
                {importResult.errors.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="size-4 text-red-500" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-400">{tp.importErrors}</span>
                    </div>
                    <ul className="space-y-1">
                      {importResult.errors.map((e, i) => (
                        <li key={i} className="text-xs text-red-600 dark:text-red-400">{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="ghost" size="sm" onClick={downloadTemplate} className="gap-1.5">
              <Download className="size-4" />
              {tp.downloadTemplate}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportOpen(false)} disabled={isImporting}>
                {isImporting ? '' : 'Close'}
              </Button>
              <Button onClick={handleImport} disabled={!importFile || isImporting}>
                {isImporting ? <><Loader2 className="mr-2 size-4 animate-spin" />{tp.importing}</> : tp.importProducts}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
