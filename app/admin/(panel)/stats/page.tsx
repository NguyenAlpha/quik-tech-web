'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Building2, TrendingUp, Users, CreditCard, AlertCircle, Loader2 } from 'lucide-react'
import { adminGetStats } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'
import { toast } from 'sonner'
import type { AdminStats } from '@/lib/types'

const planColors: Record<string, string> = {
  FREE: 'bg-slate-600',
  BASIC: 'bg-blue-500',
  PRO: 'bg-amber-500',
}

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-400">{label}</p>
        <div className="flex size-8 items-center justify-center rounded-lg bg-slate-800">
          <Icon className="size-4 text-slate-400" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

export default function AdminStatsPage() {
  const { t } = useLanguage()
  const ts = t.subscription
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    adminGetStats()
      .then(setStats)
      .catch(() => toast.error(ts.statsLoadError))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-500">
        <AlertCircle className="size-6" />
        <p className="text-sm">{ts.statsLoadError}</p>
      </div>
    )
  }

  const totalPaid = stats.freePlan + stats.basicPlan + stats.proPlan
  const planBreakdown = [
    { label: 'FREE', count: stats.freePlan },
    { label: 'BASIC', count: stats.basicPlan },
    { label: 'PRO', count: stats.proPlan },
  ]

  const maxRevenue = Math.max(...stats.revenueLast6Months.map(m => m.amount), 1)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{ts.statsTitle}</h1>
        <p className="text-sm text-slate-400 mt-1">{ts.statsSubtitle}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Building2} label={ts.statsTotalBusinesses} value={stats.totalBusinesses} />
        <StatCard
          icon={Users}
          label={ts.statsTotalUsers}
          value={stats.totalUsers}
          sub={`${stats.activeUsers} ${ts.statsActive.toLowerCase()}`}
        />
        <StatCard
          icon={CreditCard}
          label={ts.statsPendingInvoices}
          value={stats.pendingInvoices}
        />
        <StatCard
          icon={TrendingUp}
          label={ts.statsRevenueThisMonth}
          value={formatCurrency(stats.revenueThisMonth)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Plan Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="size-4 text-slate-400" />
            <h2 className="text-sm font-medium text-slate-200">{ts.statsPlanBreakdown}</h2>
          </div>
          <div className="space-y-3">
            {planBreakdown.map(p => (
              <div key={p.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-400">{p.label}</span>
                  <span className="text-xs text-slate-300">{p.count} / {totalPaid}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800">
                  <div
                    className={`h-2 rounded-full ${planColors[p.label]}`}
                    style={{ width: totalPaid > 0 ? `${(p.count / totalPaid) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Sub status */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <p className="text-xs font-medium text-slate-400 mb-3">{ts.statsSubStatus}</p>
            <div className="flex gap-4">
              <div className="flex-1 rounded-lg bg-emerald-900/30 border border-emerald-800/50 p-3 text-center">
                <p className="text-lg font-bold text-emerald-400">{stats.activeSubscriptions}</p>
                <p className="text-xs text-emerald-600 mt-0.5">{ts.statsActive}</p>
              </div>
              <div className="flex-1 rounded-lg bg-red-900/30 border border-red-800/50 p-3 text-center">
                <p className="text-lg font-bold text-red-400">{stats.expiredSubscriptions}</p>
                <p className="text-xs text-red-600 mt-0.5">{ts.statsExpired}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="size-4 text-slate-400" />
            <h2 className="text-sm font-medium text-slate-200">{ts.statsRevenueChart}</h2>
          </div>
          <div className="flex items-end gap-2 h-32">
            {stats.revenueLast6Months.map(m => {
              const heightPct = maxRevenue > 0 ? (m.amount / maxRevenue) * 100 : 0
              const shortMonth = m.month.slice(5)
              return (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: '100%' }}>
                    <div
                      className="w-full rounded-t bg-red-600/80 hover:bg-red-500 transition-colors cursor-default"
                      style={{ height: `${Math.max(heightPct, 2)}%` }}
                      title={formatCurrency(m.amount)}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{shortMonth}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800">
            <p className="text-xs text-slate-500">
              Total paid: <span className="text-slate-300 font-medium">
                {formatCurrency(stats.revenueLast6Months.reduce((s, m) => s + m.amount, 0))}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
