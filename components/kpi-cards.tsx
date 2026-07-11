'use client'

import { DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { statusColorMap } from "@/lib/status-colors"
import { useLanguage } from "@/lib/language-context"
import { formatCurrency } from "@/lib/utils"
import type { DashboardKpi } from "@/lib/types"

interface KpiCardsProps {
  kpi: DashboardKpi
}

export function KpiCards({ kpi }: KpiCardsProps) {
  const { t } = useLanguage()

  function pctChange(current: number, previous: number): { value: string; trend: 'up' | 'down' } {
    if (previous === 0) return { value: '+0.0%', trend: 'up' }
    const pct = ((current - previous) / previous) * 100
    return {
      value: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
      trend: pct >= 0 ? 'up' : 'down',
    }
  }

  const revenueChange = pctChange(kpi.revenueThisMonth, kpi.revenueLastMonth)
  const ordersChange = pctChange(kpi.ordersThisMonth, kpi.ordersLastMonth)
  const collectedChange = pctChange(kpi.collectedThisMonth, kpi.collectedLastMonth)

  const kpiData = [
    {
      titleKey: "totalRevenue" as const,
      value: formatCurrency(kpi.revenueThisMonth),
      change: revenueChange,
      icon: DollarSign,
    },
    {
      titleKey: "orders" as const,
      value: kpi.ordersThisMonth.toLocaleString(),
      change: ordersChange,
      icon: ShoppingCart,
    },
    {
      titleKey: "collectedRevenue" as const,
      value: formatCurrency(kpi.collectedThisMonth),
      change: collectedChange,
      icon: Package,
    },
    {
      titleKey: "customers" as const,
      value: kpi.totalCustomers.toLocaleString(),
      change: null,
      icon: Users,
    },
  ]

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((item) => (
        <Card key={item.titleKey} className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {t.dashboard[item.titleKey]}
              </span>
              <div className="flex size-10 items-center justify-center rounded-full bg-muted/50">
                <item.icon className="size-5 text-muted-foreground" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{item.value}</p>
              {item.change !== null && (
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.change.trend === "up"
                        ? statusColorMap.completed.badge
                        : statusColorMap.error.badge
                    }`}
                  >
                    {item.change.trend === "up" ? (
                      <TrendingUp className="size-3" />
                    ) : (
                      <TrendingDown className="size-3" />
                    )}
                    {item.change.value}
                  </span>
                  <span className="text-xs text-muted-foreground">{t.dashboard.vsLastMonth}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
