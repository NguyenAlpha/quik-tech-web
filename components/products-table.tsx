'use client'

import { useRouter } from 'next/navigation'
import { Product } from '@/lib/types'
import { useLanguage } from '@/lib/language-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, Eye, MoreHorizontal, Package, Pencil, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { statusColorMap } from '@/lib/status-colors'
import { formatCurrency } from '@/lib/utils'

interface ProductsTableProps {
  products: Product[]
  onDelete: (id: string) => void
  onEdit: (product: Product) => void
  onStatusChange: (id: string, isActive: boolean) => void
  isDeleting: string | null
  sortBy: 'name' | 'updatedAt'
  sortDir: 'asc' | 'desc'
  onSort: (dir: 'asc' | 'desc' | null) => void
}

interface ProductActionsProps {
  product: Product
  isDeleting: string | null
  onDelete: (id: string) => void
  onEdit: (product: Product) => void
  onStatusChange: (id: string, isActive: boolean) => void
}

function ProductActionsMenu({ product, isDeleting, onDelete, onEdit, onStatusChange }: ProductActionsProps) {
  const { t } = useLanguage()
  const tp = t.products
  const router = useRouter()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isDeleting === product.id}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/products/${product.id}`)}>
          <Eye className="mr-2 size-4" />
          View Detail
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(product)}>
          <Pencil className="mr-2 size-4" />
          {t.common.edit}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatusChange(product.id, !product.isActive)}>
          {product.isActive
            ? <ToggleLeft className="mr-2 size-4" />
            : <ToggleRight className="mr-2 size-4" />}
          {product.isActive ? tp.inactive : tp.active}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={() => { if (confirm(tp.confirmDelete)) onDelete(product.id) }}
        >
          <Trash2 className="mr-2 size-4" />
          {t.common.delete}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ProductsTable({ products, onDelete, onEdit, onStatusChange, isDeleting, sortBy, sortDir, onSort }: ProductsTableProps) {
  const { t } = useLanguage()
  const tp = t.products

  const SortIcon = sortBy !== 'name' ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="flex h-32 flex-col items-center justify-center gap-2">
            <Package className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{tp.noProducts}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="flex flex-col overflow-hidden rounded-xl border sm:hidden">
        {products.map((product) => {
          const isLowStock = product.totalStock <= product.minStockLevel
          return (
            <div
              key={product.id}
              className={`flex items-center gap-3 border-b p-4 last:border-b-0 ${isLowStock ? 'bg-yellow-50/50 dark:bg-yellow-950/20' : 'bg-card'}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {isLowStock && <AlertTriangle className="size-3.5 shrink-0 text-yellow-600 dark:text-yellow-500" />}
                  <p className="truncate font-medium text-sm">{product.name}</p>
                </div>
                <p className="font-mono text-xs text-muted-foreground">{product.sku}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{product.categoryName || '—'}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="font-mono text-xs font-semibold">{formatCurrency(product.sellingPrice)}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{tp.minimumStock}: {product.totalStock}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Badge
                  variant={product.isActive ? 'default' : 'secondary'}
                  className={product.isActive ? statusColorMap.completed.badge : statusColorMap.pending.badge}
                >
                  {product.isActive ? tp.active : tp.inactive}
                </Badge>
                <ProductActionsMenu
                  product={product}
                  isDeleting={isDeleting}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onStatusChange={onStatusChange}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop table */}
      <Card className="hidden sm:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">
                  <button
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={() => {
                      if (sortBy !== 'name') onSort('asc')
                      else onSort(sortDir === 'asc' ? 'desc' : null)
                    }}
                  >
                    {tp.productName}
                    <SortIcon className="size-3.5" />
                  </button>
                </TableHead>
                <TableHead>{tp.category}</TableHead>
                <TableHead>{tp.costPrice}</TableHead>
                <TableHead>{tp.sellingPrice}</TableHead>
                <TableHead className="text-center">{tp.minimumStock}</TableHead>
                <TableHead className="text-center">{tp.status}</TableHead>
                <TableHead className="pr-6 text-right"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const isLowStock = product.totalStock <= product.minStockLevel
                const marginPercent = product.costPrice > 0
                  ? (((product.sellingPrice - product.costPrice) / product.costPrice) * 100).toFixed(1)
                  : null

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
                      <span className="text-sm">{product.categoryName || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{formatCurrency(product.costPrice)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm font-medium">{formatCurrency(product.sellingPrice)}</span>
                      {marginPercent && (
                        <span className="ml-2 text-xs text-muted-foreground">({marginPercent}%)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <p className="text-sm font-medium">{product.totalStock}</p>
                      <p className="text-xs text-muted-foreground">Min: {product.minStockLevel}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={product.isActive ? 'default' : 'secondary'}
                        className={product.isActive ? statusColorMap.completed.badge : statusColorMap.pending.badge}
                      >
                        {product.isActive ? tp.active : tp.inactive}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <ProductActionsMenu
                        product={product}
                        isDeleting={isDeleting}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onStatusChange={onStatusChange}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
