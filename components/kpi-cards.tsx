'use client'

import { DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { statusColorMap } from "@/lib/status-colors"
import { useLanguage } from "@/lib/language-context"

export function KpiCards() {
  const { t } = useLanguage()

  const kpiData = [
    {
      titleKey: "totalRevenue" as const,
      value: "$45,231.89",
      change: "+20.1%",
      trend: "up" as const,
      icon: DollarSign,
    },
    {
      titleKey: "orders" as const,
      value: "2,350",
      change: "+15.2%",
      trend: "up" as const,
      icon: ShoppingCart,
    },
    {
      titleKey: "inventoryValue" as const,
      value: "$128,430",
      change: "-4.5%",
      trend: "down" as const,
      icon: Package,
    },
    {
      titleKey: "customers" as const,
      value: "1,429",
      change: "+12.3%",
      trend: "up" as const,
      icon: Users,
    },
  ]

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((kpi) => (
        <Card key={kpi.titleKey} className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {t.dashboard[kpi.titleKey]}
              </span>
              <div className="flex size-10 items-center justify-center rounded-full bg-muted/50">
                <kpi.icon className="size-5 text-muted-foreground" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-3xl font-semibold tracking-tight">{kpi.value}</p>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    kpi.trend === "up"
                      ? statusColorMap.completed.badge
                      : statusColorMap.error.badge
                  }`}
                >
                  {kpi.trend === "up" ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {kpi.change}
                </span>
                <span className="text-xs text-muted-foreground">{t.dashboard.vsLastMonth}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
