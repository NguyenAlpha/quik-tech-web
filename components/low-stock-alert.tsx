'use client'

import { AlertTriangle, ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { statusColorMap } from "@/lib/status-colors"
import { useLanguage } from "@/lib/language-context"
import type { DashboardLowStockProduct } from "@/lib/types"

interface LowStockAlertProps {
  products: DashboardLowStockProduct[]
}

export function LowStockAlert({ products }: LowStockAlertProps) {
  const { t } = useLanguage()

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex size-9 items-center justify-center rounded-full ${statusColorMap.warning.bg}`}>
              <AlertTriangle className={`size-4 ${statusColorMap.warning.icon}`} />
            </div>
            <div className="space-y-0.5">
              <CardTitle className="text-base font-medium">{t.lowStock.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {products.length} {t.lowStock.itemsNeedAttention}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="gap-1 text-sm text-muted-foreground hover:text-foreground">
            {t.common.viewAll}
            <ArrowUpRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-5">
          {products.map((product) => {
            const percentage = product.minStockLevel > 0
              ? (product.totalStock / product.minStockLevel) * 100
              : 0
            const isLow = percentage <= 25
            return (
              <div key={product.sku} className="space-y-2.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-none">
                      {product.productName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.lowStock.sku}: {product.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold tabular-nums ${isLow ? statusColorMap.error.text : ""}`}>
                      {product.totalStock}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.lowStock.of} {product.minStockLevel}
                    </p>
                  </div>
                </div>
                <Progress
                  value={percentage}
                  className={`h-1.5 ${isLow ? statusColorMap.error.progressBar : statusColorMap.warning.progressBar}`}
                />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
