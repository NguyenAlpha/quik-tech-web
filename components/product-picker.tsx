'use client'

import { useId, useMemo, useState } from 'react'
import { PackageOpen, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/lib/language-context'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/lib/types'

interface ProductPickerProps {
  products: Product[]
  addedProductIds: ReadonlySet<string>
  priceField: 'costPrice' | 'sellingPrice'
  onOpenChange: (open: boolean) => void
  onAdd: (products: Product[]) => void
}

// Mount only while open so each selection session starts with a fresh search and selection.
export function ProductPicker({ products, addedProductIds, priceField, onOpenChange, onAdd }: ProductPickerProps) {
  const { t } = useLanguage()
  const tpo = t.purchaseOrders
  const pickerId = useId()
  const [productSearch, setProductSearch] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLocaleLowerCase()
    return products
      .filter(product => product.isActive)
      .filter(product => !query || [product.name, product.sku, product.categoryName]
        .some(value => value?.toLocaleLowerCase().includes(query)))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [productSearch, products])

  const selectedProducts = products.filter(product =>
    product.isActive && selectedProductIds.has(product.id) && !addedProductIds.has(product.id)
  )

  const toggleProductSelection = (productId: string, checked: boolean) => {
    setSelectedProductIds(previous => {
      const next = new Set(previous)
      if (checked) next.add(productId)
      else next.delete(productId)
      return next
    })
  }

  const addSelectedProducts = () => {
    onAdd(selectedProducts)
    onOpenChange(false)
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(36rem,85dvh)] !max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-4 pr-10">
          <DialogTitle>{tpo.selectProducts}</DialogTitle>
          <DialogDescription>{tpo.selectProductsDescription}</DialogDescription>
        </DialogHeader>

        <div className="shrink-0 border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={productSearch}
              onChange={event => setProductSearch(event.target.value)}
              className="pl-9"
              placeholder={tpo.searchProducts}
              aria-label={tpo.searchProducts}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {filteredProducts.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
              <PackageOpen className="size-8 opacity-50" />
              <p className="text-sm">{tpo.noMatchingProducts}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredProducts.map(product => {
                const alreadyAdded = addedProductIds.has(product.id)
                const selected = selectedProductIds.has(product.id)
                const checkboxId = `${pickerId}-${product.id}`
                return (
                  <label
                    key={product.id}
                    htmlFor={checkboxId}
                    className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${alreadyAdded ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-muted'}`}
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={alreadyAdded || selected}
                      disabled={alreadyAdded}
                      onCheckedChange={checked => toggleProductSelection(product.id, checked === true)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        {alreadyAdded && (
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                            {tpo.alreadyAdded}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {product.sku} · {product.categoryName} · {product.unitName}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium">{formatCurrency(product[priceField])}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-4 py-4">
          <p className="text-sm text-muted-foreground">
            {selectedProducts.length} {tpo.selectedProducts}
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="button" disabled={selectedProducts.length === 0} onClick={addSelectedProducts}>
              {tpo.addSelectedProducts}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
