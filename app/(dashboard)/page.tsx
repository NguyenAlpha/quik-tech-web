'use client'

import { useEffect, useState } from "react"
import { KpiCards } from "@/components/kpi-cards"
import { SalesChart } from "@/components/sales-chart"
import { RecentOrders } from "@/components/recent-orders"
import { LowStockAlert } from "@/components/low-stock-alert"
import { PageError } from "@/components/page-error"
import { useLanguage } from "@/lib/language-context"
import { getDashboard, ApiError } from "@/lib/api"
import type { DashboardData } from "@/lib/types"

function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-10">
      <div className="space-y-2">
        <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-56 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border bg-muted" />
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-7">
        <div className="h-64 animate-pulse rounded-xl border bg-muted lg:col-span-4" />
        <div className="h-64 animate-pulse rounded-xl border bg-muted lg:col-span-3" />
      </div>
      <div className="h-48 animate-pulse rounded-xl border bg-muted" />
    </div>
  )
}

export default function DashboardPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)

  const init = async () => {
    setIsLoading(true)
    setPageError(null)
    try {
      setData(await getDashboard())
    } catch (err) {
      setPageError(err instanceof ApiError ? err.message : 'Failed to load dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { init() }, [])

  if (isLoading) return <DashboardSkeleton />
  if (pageError) return <PageError message={pageError} onRetry={init} />

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t.dashboard.title}
        </h1>
        <p className="text-base text-muted-foreground">
          {t.dashboard.subtitle}
        </p>
      </div>

      {data && (
        <>
          <KpiCards kpi={data.kpi} />

          <div className="grid gap-8 lg:grid-cols-7">
            <div className="lg:col-span-4">
              <SalesChart data={data.salesChart} />
            </div>
            <div className="lg:col-span-3">
              <LowStockAlert products={data.lowStockProducts} />
            </div>
          </div>

          <RecentOrders orders={data.recentOrders} />
        </>
      )}
    </div>
  )
}
