'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/language-context'
import { EditProductModal } from '@/components/edit-product-modal'
import { ProductDetail, Category, Unit, CreateProductInput } from '@/lib/types'
import { getProduct, getCategories, getUnits, updateProduct, setProductStatus } from '@/lib/api'
import { statusColorMap } from '@/lib/status-colors'
import { formatCurrency } from '@/lib/utils'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { t } = useLanguage()
  const tp = t.products

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isEditLoading, setIsEditLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [p, cats, uts] = await Promise.all([getProduct(id), getCategories(), getUnits()])
        setProduct(p)
        setCategories(cats)
        setUnits(uts)
      } catch {
        toast.error(tp.errorLoadingProduct)
      } finally {
        setIsPageLoading(false)
      }
    }
    load()
  }, [id])

  const handleEdit = async (data: CreateProductInput) => {
    if (!product) return
    setIsEditLoading(true)
    try {
      await updateProduct(product.id, data)
      const refreshed = await getProduct(id)
      setProduct(refreshed)
      toast.success(tp.productUpdated)
      setIsEditOpen(false)
    } catch {
      toast.error(tp.errorUpdatingProduct)
    } finally {
      setIsEditLoading(false)
    }
  }

  const handleStatusChange = async () => {
    if (!product) return
    try {
      const updated = await setProductStatus(product.id, !product.isActive)
      setProduct({ ...product, isActive: updated.isActive })
    } catch {
      toast.error(tp.errorUpdatingProduct)
    }
  }

  if (isPageLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">{t.common.loading}</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">{tp.detailNotFound}</p>
      </div>
    )
  }

  const categoryName = categories.find((c) => c.id === product.categoryId)?.name ?? '-'
  const unit = units.find((u) => u.id === product.unitId)
  const margin = product.sellingPrice - product.costPrice
  const marginPercent = product.costPrice > 0 ? ((margin / product.costPrice) * 100).toFixed(1) : '0'
  const isLowStock = product.totalStock <= product.minStockLevel

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:p-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{product.name}</h1>
              <Badge
                variant={product.isActive ? 'default' : 'secondary'}
                className={product.isActive ? statusColorMap.completed.badge : statusColorMap.pending.badge}
              >
                {product.isActive ? tp.active : tp.inactive}
              </Badge>
            </div>
            <p className="font-mono text-sm text-muted-foreground">{product.sku}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleStatusChange}>
            {product.isActive
              ? <><ToggleLeft className="mr-2 size-4" />{tp.inactive}</>
              : <><ToggleRight className="mr-2 size-4" />{tp.active}</>
            }
          </Button>
          <Button size="sm" onClick={() => setIsEditOpen(true)}>
            <Pencil className="mr-2 size-4" />
            {t.common.edit}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tp.detailBasicInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label={tp.productName} value={product.name} />
            <Row label="SKU" value={<span className="font-mono">{product.sku}</span>} />
            <Row label={tp.category} value={categoryName} />
            <Row label={tp.unit} value={unit ? `${unit.name} (${unit.abbreviation})` : '-'} />
            {product.description && (
              <div className="pt-1">
                <p className="mb-1 text-sm text-muted-foreground">{tp.description}</p>
                <p className="text-sm">{product.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tp.detailPricing}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label={tp.costPrice} value={<span className="font-mono">{formatCurrency(product.costPrice)}</span>} />
            <Row label={tp.sellingPrice} value={<span className="font-mono">{formatCurrency(product.sellingPrice)}</span>} />
            <Row
              label={tp.detailMargin}
              value={
                <span className="font-mono">
                  {formatCurrency(margin)} <span className="text-muted-foreground">({marginPercent}%)</span>
                </span>
              }
            />
          </CardContent>
        </Card>

        {/* Stock */}
        <Card className={isLowStock ? 'border-yellow-400 dark:border-yellow-600' : ''}>
          <CardHeader>
            <CardTitle className="text-base">
              {tp.detailStock}
              {isLowStock && (
                <span className="ml-2 text-sm font-normal text-yellow-600 dark:text-yellow-500">— {tp.detailLowStock}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label={tp.detailCurrentStock} value={<span className={`font-mono font-medium ${isLowStock ? 'text-yellow-600 dark:text-yellow-500' : ''}`}>{product.totalStock}</span>} />
            <Row label={tp.minimumStock} value={<span className="font-mono">{product.minStockLevel}</span>} />
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tp.detailTimestamps}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label={tp.detailCreated} value={product.createdAt ? new Date(product.createdAt).toLocaleString() : '-'} />
            <Row label={tp.detailUpdated} value={product.updatedAt ? new Date(product.updatedAt).toLocaleString() : '-'} />
          </CardContent>
        </Card>
      </div>

      {/* Price History */}
      {product.priceHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tp.detailPriceHistory}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-6 py-3 font-medium">{tp.detailColDate}</th>
                    <th className="px-6 py-3 font-medium">{tp.detailColChangedBy}</th>
                    <th className="px-6 py-3 font-medium">{tp.detailColCostPrice}</th>
                    <th className="px-6 py-3 font-medium">{tp.detailColSellingPrice}</th>
                  </tr>
                </thead>
                <tbody>
                  {product.priceHistory.map((h) => (
                    <tr key={h.id} className="border-b last:border-0">
                      <td className="px-6 py-3 text-muted-foreground">
                        {new Date(h.changedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">{h.changedByUsername}</td>
                      <td className="px-6 py-3 font-mono">
                        {formatCurrency(h.oldCostPrice)}
                        <span className="mx-1 text-muted-foreground">→</span>
                        {formatCurrency(h.newCostPrice)}
                      </td>
                      <td className="px-6 py-3 font-mono">
                        {formatCurrency(h.oldSellingPrice)}
                        <span className="mx-1 text-muted-foreground">→</span>
                        {formatCurrency(h.newSellingPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <EditProductModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        product={product}
        categories={categories}
        units={units}
        onSubmit={handleEdit}
        isLoading={isEditLoading}
      />
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}
