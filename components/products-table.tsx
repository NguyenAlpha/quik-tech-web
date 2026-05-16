'use client'

import { Product, Category, Unit } from '@/lib/types'
import { useLanguage } from '@/lib/language-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { statusColorMap } from '@/lib/status-colors'

interface ProductsTableProps {
  products: Product[]
  categories: Category[]
  units: Unit[]
  onDelete: (id: string) => void
  isDeleting: string | null
}

export function ProductsTable({ products, categories, units, onDelete, isDeleting }: ProductsTableProps) {
  const { t } = useLanguage()

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || '-'
  }

  const getUnitAbbr = (unitId: string) => {
    return units.find((u) => u.id === unitId)?.abbreviation || '-'
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-lg font-medium text-foreground">{t.products.noProducts}</p>
        <p className="text-sm text-muted-foreground">Start by adding your first product</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">{t.products.productName}</TableHead>
            <TableHead>{t.products.category}</TableHead>
            <TableHead>{t.products.costPrice}</TableHead>
            <TableHead>{t.products.sellingPrice}</TableHead>
            <TableHead className="text-center">{t.products.minimumStock}</TableHead>
            <TableHead className="text-center">{t.products.status}</TableHead>
            <TableHead className="pr-6 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const isLowStock = product.totalStock <= product.minStockLevel
            const margin = product.sellingPrice - product.costPrice
            const marginPercent = ((margin / product.costPrice) * 100).toFixed(1)

            return (
              <TableRow key={product.id} className={isLowStock ? 'bg-yellow-50/50 dark:bg-yellow-950/20' : ''}>
                <TableCell className="pl-6">
                  <div className="flex items-start gap-3">
                    {isLowStock && (
                      <AlertTriangle className="mt-0.5 size-4 text-yellow-600 dark:text-yellow-500" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{product.sku}</p>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{getCategoryName(product.categoryId)}</span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm">${product.costPrice.toFixed(2)}</span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm font-medium">${product.sellingPrice.toFixed(2)}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({marginPercent}%)
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <div>
                    <p className="text-sm font-medium">{product.totalStock}</p>
                    <p className="text-xs text-muted-foreground">Min: {product.minStockLevel}</p>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={product.isActive ? 'default' : 'secondary'}
                    className={product.isActive ? statusColorMap.completed.badge : statusColorMap.pending.badge}
                  >
                    {product.isActive ? t.products.active : t.products.inactive}
                  </Badge>
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(t.products.confirmDelete)) {
                        onDelete(product.id)
                      }
                    }}
                    disabled={isDeleting === product.id}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
