'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowUpRight, Building2, CreditCard, RefreshCw, TrendingUp, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { adminGetStats } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'
import { useAdminCopy } from '@/lib/admin-copy'
import { errorMessage } from '@/lib/api-error'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page-header'
import type { AdminStats } from '@/lib/types'

function StatCard({ icon: Icon, label, value, sub, attention = false }: {
  icon: React.ElementType
  label: string
  value: string | number
  sub: string
  attention?: boolean
}) {
  return (
    <Card className={attention ? 'gap-0 border-amber-200 bg-amber-50/50 py-0 dark:border-amber-900 dark:bg-amber-950/20' : 'gap-0 py-0'}>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className={attention ? 'rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'rounded-lg bg-primary/10 p-2 text-primary'}>
            <Icon className="size-4" />
          </div>
        </div>
        <p className="break-words text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  )
}

export default function AdminStatsPage() {
  const { t, language } = useLanguage()
  const ts = t.subscription
  const copy = useAdminCopy()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const locale = language === 'vi' ? 'vi-VN' : 'en-US'

  const loadStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setStats(await adminGetStats())
    } catch (err) {
      setError(errorMessage(err, t, ts.statsLoadError))
    } finally {
      setIsLoading(false)
    }
  }, [t, ts.statsLoadError])

  useEffect(() => { void loadStats() }, [loadStats])

  const planBreakdown = stats ? [
    { label: 'Free', count: stats.freePlan, color: 'bg-slate-400' },
    { label: 'Basic', count: stats.basicPlan, color: 'bg-primary' },
    { label: 'Pro', count: stats.proPlan, color: 'bg-violet-500' },
  ] : []
  const totalPlans = planBreakdown.reduce((sum, plan) => sum + plan.count, 0)
  const revenueTotal = stats?.revenueLast6Months.reduce((sum, month) => sum + month.amount, 0) ?? 0
  const monthLabel = (month: string) => new Date(`${month}-01T00:00:00`).toLocaleDateString(locale, { month: 'short', year: '2-digit' })

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <PageHeader title={copy.overview} subtitle={copy.overviewDescription}>
        <Button variant="outline" onClick={loadStats} disabled={isLoading} className="gap-2 self-start">
          <RefreshCw className={isLoading ? 'size-4 animate-spin' : 'size-4'} />
          {copy.refresh}
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-6" role="status" aria-label={t.common.loading}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <Skeleton className="h-96 rounded-xl xl:col-span-2" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-4 text-center" role="alert">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={loadStats}>{t.common.retry}</Button>
          </CardContent>
        </Card>
      ) : stats && (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Building2} label={copy.totalBusinesses} value={stats.totalBusinesses.toLocaleString(locale)} sub={copy.workspace} />
            <StatCard icon={Users} label={copy.totalUsers} value={stats.totalUsers.toLocaleString(locale)} sub={`${stats.activeUsers.toLocaleString(locale)} ${ts.statsActive.toLowerCase()}`} />
            <StatCard icon={CreditCard} label={ts.statsPendingInvoices} value={stats.pendingInvoices.toLocaleString(locale)} sub={copy.pendingDescription} attention={stats.pendingInvoices > 0} />
            <StatCard icon={TrendingUp} label={ts.statsRevenueThisMonth} value={formatCurrency(stats.revenueThisMonth)} sub={copy.revenueDescription} />
          </div>

          {stats.pendingInvoices > 0 && (
            <div className="flex flex-col gap-3 rounded-xl border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"><CreditCard className="size-4" /></span>
                <div>
                  <p className="text-sm font-medium">{stats.pendingInvoices.toLocaleString(locale)} · {ts.statsPendingInvoices}</p>
                  <p className="text-xs text-muted-foreground">{copy.pendingDescription}</p>
                </div>
              </div>
              <Button asChild size="sm" className="gap-2"><Link href="/admin/subscriptions">{copy.reviewInvoices}<ArrowUpRight className="size-4" /></Link></Button>
            </div>
          )}

          <div className="grid items-stretch gap-6 xl:grid-cols-3">
            {/* Revenue Chart */}
            <Card className="min-w-0 xl:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">{copy.revenueTitle}</CardTitle>
                <CardDescription>{copy.revenueDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <p className="text-2xl font-semibold tracking-tight tabular-nums">{formatCurrency(revenueTotal)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{copy.sixMonthTotal}</p>
                </div>
                {stats.revenueLast6Months.length === 0 || !stats.revenueLast6Months.some(month => month.amount !== 0) ? (
                  <div className="flex h-64 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{copy.noRevenue}</div>
                ) : (
                  <div className="h-64 w-full min-w-0" role="img" aria-label={copy.revenueTitle}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={stats.revenueLast6Months} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} accessibilityLayer>
                        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                        <XAxis dataKey="month" tickFormatter={monthLabel} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickMargin={12} minTickGap={12} />
                        <YAxis width={54} tickFormatter={value => new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value)} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                        <Tooltip cursor={{ fill: 'var(--muted)' }} labelFormatter={label => monthLabel(String(label))} formatter={value => [formatCurrency(Number(value)), t.common.amount]} contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--popover-foreground)' }} itemStyle={{ color: 'var(--primary)' }} />
                        <Bar dataKey="amount" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={44} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <table className="sr-only">
                  <caption>{copy.revenueTitle}</caption>
                  <thead><tr><th scope="col">{t.common.date}</th><th scope="col">{t.common.amount}</th></tr></thead>
                  <tbody>{stats.revenueLast6Months.map(month => <tr key={month.month}><th scope="row">{monthLabel(month.month)}</th><td>{formatCurrency(month.amount)}</td></tr>)}</tbody>
                </table>
              </CardContent>
            </Card>

            {/* Plan Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{ts.statsPlanBreakdown}</CardTitle>
                <CardDescription>{copy.planDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {totalPlans === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{copy.noSubscriptions}</p> : (
                  <div className="space-y-5">
                    {planBreakdown.map(plan => (
                      <div key={plan.label}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium">{plan.label}</span>
                          <span className="tabular-nums text-muted-foreground">{plan.count.toLocaleString(locale)} <span className="ml-1 text-xs">({Math.round(plan.count / totalPlans * 100)}%)</span></span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={plan.label} aria-valuenow={plan.count} aria-valuemin={0} aria-valuemax={totalPlans}>
                          <div className={`h-full rounded-full ${plan.color}`} style={{ width: `${plan.count / totalPlans * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Sub status */}
                <div className="space-y-3 border-t pt-5">
                  <p className="text-sm font-medium">{copy.subscriptionStatus}</p>
                  <div className="flex items-center justify-between gap-2 text-sm"><span className="flex items-center gap-2 text-muted-foreground"><span className="size-2 rounded-full bg-emerald-500" />{copy.active}</span><span className="font-medium tabular-nums">{stats.activeSubscriptions.toLocaleString(locale)}</span></div>
                  <div className="flex items-center justify-between gap-2 text-sm"><span className="flex items-center gap-2 text-muted-foreground"><span className="size-2 rounded-full bg-amber-500" />{copy.expired}</span><span className="font-medium tabular-nums">{stats.expiredSubscriptions.toLocaleString(locale)}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
