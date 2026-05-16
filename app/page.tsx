'use client'

import { KpiCards } from "@/components/kpi-cards"
import { SalesChart } from "@/components/sales-chart"
import { RecentOrders } from "@/components/recent-orders"
import { LowStockAlert } from "@/components/low-stock-alert"
import { useLanguage } from "@/lib/language-context"

export default function DashboardPage() {
  const { t } = useLanguage()

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 lg:p-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {t.dashboard.title}
        </h1>
        <p className="text-base text-muted-foreground">
          {t.dashboard.subtitle}
        </p>
      </div>

      <KpiCards />

      <div className="grid gap-8 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <SalesChart />
        </div>
        <div className="lg:col-span-3">
          <LowStockAlert />
        </div>
      </div>

      <RecentOrders />
    </div>
  )
}
