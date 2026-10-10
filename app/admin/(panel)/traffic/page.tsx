'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Activity, AlertTriangle, Ban, Clock, Cpu, Database, HardDrive, RefreshCw, ServerCrash, Timer } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/lib/language-context'
import { useAdminCopy } from '@/lib/admin-copy'
import { useTrafficCopy } from '@/lib/traffic-copy'
import { errorMessage } from '@/lib/api-error'
import { getSystemHealth, getTrafficReport, type SystemHealth, type TrafficRange, type TrafficReport } from '@/lib/traffic'

const RANGES: TrafficRange[] = ['1h', '24h', '7d', '30d']
const AUTO_REFRESH_MS = 30_000
// Màu đã chạy validator dataviz: xanh = thành công (bước riêng cho dark mode), 4xx/5xx dùng màu trạng thái
// cố định warning/critical — luôn đi kèm legend có chữ + bảng số liệu vì warning tương phản thấp trên nền sáng
const PALETTE = '[--traffic-ok:#0066cc] dark:[--traffic-ok:#3d8ef0] [--traffic-warn:#fab219] [--traffic-critical:#d03b3b]'
const TOOLTIP_STYLE = { background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--popover-foreground)' }
const AXIS_TICK = { fontSize: 11, fill: 'var(--muted-foreground)' }

type EndpointSort = 'requests' | 'latency' | 'errors'

function formatMs(ms: number | null | undefined, unavailable: string) {
  if (ms === null || ms === undefined) return unavailable
  return ms >= 1000 ? `${(ms / 1000).toFixed(ms >= 10_000 ? 0 : 1)} s` : `${Math.round(ms)} ms`
}

function formatBytes(bytes: number | null) {
  if (bytes === null) return null
  const mb = bytes / 1024 / 1024
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`
}

function formatUptime(seconds: number | null) {
  if (seconds === null) return null
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

function statusTone(status: number) {
  return status >= 500 ? 'var(--traffic-critical)' : status >= 400 ? 'var(--traffic-warn)' : 'var(--traffic-ok)'
}

function StatTile({ icon: Icon, label, value, sub, attention = false }: {
  icon: React.ElementType; label: string; value: string; sub: string; attention?: boolean
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

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map(item => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: item.color }} aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

export default function AdminTrafficPage() {
  const { t, language } = useLanguage()
  const admin = useAdminCopy()
  const copy = useTrafficCopy()
  const locale = language === 'vi' ? 'vi-VN' : 'en-US'
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale])
  const compact = useMemo(() => new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }), [locale])
  const percent = useMemo(() => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }), [locale])

  const [range, setRange] = useState<TrafficRange>('24h')
  const [report, setReport] = useState<TrafficReport | null>(null)
  const [system, setSystem] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [systemError, setSystemError] = useState<string | null>(null)
  const [endpointSort, setEndpointSort] = useState<EndpointSort>('requests')
  const requestId = useRef(0)

  // background = làm mới tự động: không hiện skeleton, giữ dữ liệu cũ nếu lỗi
  const load = useCallback(async (background = false) => {
    const request = ++requestId.current
    if (!background) { setLoading(true); setError(null) }
    const [reportResult, systemResult] = await Promise.allSettled([getTrafficReport(range), getSystemHealth()])
    if (request !== requestId.current) return
    if (reportResult.status === 'fulfilled') { setReport(reportResult.value); setError(null) }
    else if (!background) setError(errorMessage(reportResult.reason, t, copy.loadError))
    if (systemResult.status === 'fulfilled') { setSystem(systemResult.value); setSystemError(null) }
    else setSystemError(errorMessage(systemResult.reason, t, copy.systemError))
    setLoading(false)
  }, [range, t, copy.loadError, copy.systemError])

  useEffect(() => { void load(); return () => { requestId.current++ } }, [load])
  useEffect(() => {
    if (range !== '1h' && range !== '24h') return
    const timer = window.setInterval(() => void load(true), AUTO_REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [range, load])

  const timeLabel = useCallback((iso: string) => {
    const date = new Date(iso)
    return range === '1h' || range === '24h'
      ? date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }, [range, locale])

  const series = useMemo(() => (report?.series ?? []).map(point => ({
    ...point,
    success: Math.max(0, point.requests - point.clientErrors - point.serverErrors),
  })), [report])

  const endpoints = useMemo(() => {
    const rows = [...(report?.endpoints ?? [])]
    if (endpointSort === 'latency') rows.sort((a, b) => (b.p95Ms ?? Infinity) - (a.p95Ms ?? Infinity) || b.maxMs - a.maxMs)
    if (endpointSort === 'errors') rows.sort((a, b) => b.serverErrors + b.clientErrors - (a.serverErrors + a.clientErrors))
    return rows
  }, [report, endpointSort])

  const rangeLabels: Record<TrafficRange, string> = { '1h': copy.range1h, '24h': copy.range24h, '7d': copy.range7d, '30d': copy.range30d }
  const summary = report?.summary
  const share = (value: number) => summary && summary.requests > 0 ? value / summary.requests : 0
  const hasData = !!summary && summary.requests > 0
  const businessTotal = (report?.businesses ?? []).reduce((sum, row) => sum + row.requests, 0)

  return <div className={`mx-auto w-full max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8 ${PALETTE}`}>
    <PageHeader title={copy.title} subtitle={copy.description}>
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={range} onValueChange={value => setRange(value as TrafficRange)}>
          <TabsList aria-label={copy.range}>
            {RANGES.map(value => <TabsTrigger key={value} value={value}>{rangeLabels[value]}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <Button variant="outline" disabled={loading} onClick={() => void load()}>
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />{admin.refresh}
        </Button>
      </div>
    </PageHeader>
    <p className="text-xs text-muted-foreground">
      {(range === '1h' || range === '24h') && <>{copy.autoRefresh} · </>}{copy.delayNote}
    </p>

    {loading && !report ? (
      <div className="space-y-6" role="status" aria-label={t.common.loading}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    ) : error ? (
      <Card><CardContent className="flex min-h-64 flex-col items-center justify-center gap-4 text-center" role="alert">
        <AlertTriangle className="size-6 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={() => void load()}>{t.common.retry}</Button>
      </CardContent></Card>
    ) : report && summary && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Activity} label={copy.requests} value={number.format(summary.requests)}
          sub={copy.perMinute.replace('{value}', number.format(Math.round(summary.requestsPerMinute * 10) / 10))} />
        <StatTile icon={ServerCrash} label={copy.serverErrors} value={number.format(summary.serverErrors)}
          sub={copy.errorRate.replace('{value}', percent.format(share(summary.serverErrors)))} attention={summary.serverErrors > 0} />
        <StatTile icon={Ban} label={copy.clientErrors} value={number.format(summary.clientErrors)}
          sub={`${copy.errorRate.replace('{value}', percent.format(share(summary.clientErrors)))} · ${copy.rateLimited} ${number.format(summary.rateLimited)}`} />
        <StatTile icon={Timer} label={`${copy.latency} (${copy.p95})`} value={formatMs(summary.p95Ms, copy.unavailable)}
          sub={copy.latencySub.replace('{p50}', formatMs(summary.p50Ms, '—')).replace('{p99}', formatMs(summary.p99Ms, '> 5 s')).replace('{max}', formatMs(summary.maxMs, '—'))} />
      </div>

      {!hasData ? (
        <Card><CardContent className="flex min-h-48 items-center justify-center p-6 text-center text-sm text-muted-foreground">{copy.noData}</CardContent></Card>
      ) : <>
        <div className="grid items-stretch gap-6 xl:grid-cols-3">
          <Card className="min-w-0 xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">{copy.volumeTitle}</CardTitle>
              <CardDescription>{copy.volumeDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Legend items={[
                { label: copy.success, color: 'var(--traffic-ok)' },
                { label: copy.clientErrors, color: 'var(--traffic-warn)' },
                { label: copy.serverErrors, color: 'var(--traffic-critical)' },
              ]} />
              <div className="h-72 w-full min-w-0" role="img" aria-label={copy.volumeTitle}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="time" tickFormatter={timeLabel} tickLine={false} axisLine={false} tick={AXIS_TICK} tickMargin={10} minTickGap={32} />
                    <YAxis width={48} allowDecimals={false} tickFormatter={value => compact.format(value)} tickLine={false} axisLine={false} tick={AXIS_TICK} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={label => timeLabel(String(label))}
                      formatter={(value, name) => [number.format(Number(value)), String(name)]} />
                    <Area type="monotone" dataKey="success" name={copy.success} stackId="requests" stroke="var(--traffic-ok)" strokeWidth={2} fill="var(--traffic-ok)" fillOpacity={0.18} isAnimationActive={false} />
                    <Area type="monotone" dataKey="clientErrors" name={copy.clientErrors} stackId="requests" stroke="var(--traffic-warn)" strokeWidth={2} fill="var(--traffic-warn)" fillOpacity={0.3} isAnimationActive={false} />
                    <Area type="monotone" dataKey="serverErrors" name={copy.serverErrors} stackId="requests" stroke="var(--traffic-critical)" strokeWidth={2} fill="var(--traffic-critical)" fillOpacity={0.3} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <table className="sr-only">
                <caption>{copy.volumeTitle}</caption>
                <thead><tr><th scope="col">{t.common.date}</th><th scope="col">{copy.success}</th><th scope="col">{copy.clientErrors}</th><th scope="col">{copy.serverErrors}</th></tr></thead>
                <tbody>{series.map(point => <tr key={point.time}><th scope="row">{timeLabel(point.time)}</th><td>{point.success}</td><td>{point.clientErrors}</td><td>{point.serverErrors}</td></tr>)}</tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle className="text-base">{copy.statusTitle}</CardTitle>
              <CardDescription>{copy.statusDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {report.statuses.map(row => (
                  <li key={row.status} className="space-y-1">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-mono font-medium">{row.status}</span>
                      <span className="tabular-nums text-muted-foreground">{number.format(row.requests)} · {percent.format(share(row.requests))}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted" aria-hidden>
                      <div className="h-2 rounded-full" style={{ width: `${Math.max(1, share(row.requests) * 100)}%`, background: statusTone(row.status) }} />
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">{copy.latencyTitle}</CardTitle>
            <CardDescription>{copy.latencyDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full min-w-0" role="img" aria-label={copy.latencyTitle}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="time" tickFormatter={timeLabel} tickLine={false} axisLine={false} tick={AXIS_TICK} tickMargin={10} minTickGap={32} />
                  <YAxis width={56} tickFormatter={value => formatMs(Number(value), '')} tickLine={false} axisLine={false} tick={AXIS_TICK} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={label => timeLabel(String(label))}
                    formatter={value => [formatMs(value === null ? null : Number(value), '—'), copy.p95]} />
                  <Line type="monotone" dataKey="p95Ms" name={copy.p95} stroke="var(--traffic-ok)" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <CardTitle className="text-base">{copy.endpointsTitle}</CardTitle>
              <CardDescription>{copy.endpointsDescription}</CardDescription>
            </div>
            <Tabs value={endpointSort} onValueChange={value => setEndpointSort(value as EndpointSort)}>
              <TabsList>
                <TabsTrigger value="requests">{copy.sortRequests}</TabsTrigger>
                <TabsTrigger value="latency">{copy.sortLatency}</TabsTrigger>
                <TabsTrigger value="errors">{copy.sortErrors}</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th scope="col" className="py-2 pr-3 font-medium">{copy.endpoint}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{copy.requests}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">4xx</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">5xx</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{copy.avg}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{copy.p95}</th>
                  <th scope="col" className="py-2 text-right font-medium">{copy.max}</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map(row => (
                  <tr key={`${row.method} ${row.route}`} className="border-b last:border-0">
                    <td className="max-w-[28rem] py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="shrink-0 font-mono text-[11px]">{row.method}</Badge>
                        <span className="truncate font-mono text-xs" title={row.route === '(unmatched)' ? copy.unmatched : row.route}>
                          {row.route === '(unmatched)' ? copy.unmatched : row.route}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{number.format(row.requests)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{number.format(row.clientErrors)}</td>
                    <td className={`py-2 pr-3 text-right tabular-nums ${row.serverErrors > 0 ? 'font-semibold text-destructive' : ''}`}>{number.format(row.serverErrors)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatMs(row.avgMs, '—')}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatMs(row.p95Ms, '> 5 s')}</td>
                    <td className="py-2 text-right tabular-nums">{formatMs(row.maxMs, '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">{copy.businessesTitle}</CardTitle>
            <CardDescription>{copy.businessesDescription}</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {report.businesses.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{copy.noData}</p> :
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th scope="col" className="py-2 pr-3 font-medium">{copy.business}</th>
                    <th scope="col" className="w-1/3 py-2 pr-3 font-medium">{copy.share}</th>
                    <th scope="col" className="py-2 pr-3 text-right font-medium">{copy.requests}</th>
                    <th scope="col" className="py-2 pr-3 text-right font-medium">5xx</th>
                    <th scope="col" className="py-2 text-right font-medium">{copy.avg}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.businesses.map(row => (
                    <tr key={row.businessId} className="border-b last:border-0">
                      <td className="py-2 pr-3"><span className="font-medium">{row.businessName}</span> <span className="text-xs text-muted-foreground">#{row.businessId}</span></td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 rounded-full bg-muted" aria-hidden>
                            <div className="h-2 rounded-full bg-[var(--traffic-ok)]" style={{ width: `${Math.max(1, businessTotal ? row.requests / businessTotal * 100 : 0)}%` }} />
                          </div>
                          <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">{percent.format(businessTotal ? row.requests / businessTotal : 0)}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">{number.format(row.requests)}</td>
                      <td className={`py-2 pr-3 text-right tabular-nums ${row.serverErrors > 0 ? 'font-semibold text-destructive' : ''}`}>{number.format(row.serverErrors)}</td>
                      <td className="py-2 text-right tabular-nums">{formatMs(row.avgMs, '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>}
          </CardContent>
        </Card>
      </>}
    </>}

    <SystemHealthCard system={system} error={systemError} copy={copy} number={number} percent={percent} locale={locale} />
  </div>
}

function SystemHealthCard({ system, error, copy, number, percent, locale }: {
  system: SystemHealth | null
  error: string | null
  copy: ReturnType<typeof useTrafficCopy>
  number: Intl.NumberFormat
  percent: Intl.NumberFormat
  locale: string
}) {
  const statusBadge = (status: string | null) => status === 'UP'
    ? <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">{copy.up}</Badge>
    : <Badge variant="destructive">{status === null ? copy.unavailable : status === 'DOWN' ? copy.down : status}</Badge>
  const ratio = (used: number | null, max: number | null) => used !== null && max ? Math.min(100, used / max * 100) : null
  const heapRatio = system ? ratio(system.heapUsedBytes, system.heapMaxBytes) : null
  const poolRatio = system ? ratio(system.dbConnectionsActive, system.dbConnectionsMax) : null

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="text-base">{copy.systemTitle}</CardTitle>
          <CardDescription>{copy.systemDescription}</CardDescription>
        </div>
        {system && <div className="flex items-center gap-2 text-sm">{copy.overall}: {statusBadge(system.status)}</div>}
      </CardHeader>
      <CardContent className="space-y-5">
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {!system ? !error && <Skeleton className="h-32 rounded-xl" /> : <>
          {Object.keys(system.components).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(system.components).map(([name, status]) => (
                <div key={name} className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm">
                  <span className="font-mono text-xs">{name}</span>{statusBadge(status)}
                </div>
              ))}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 rounded-xl border p-4">
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="size-4" />{copy.uptime}</p>
              <p className="text-xl font-semibold tabular-nums">{formatUptime(system.uptimeSeconds) ?? copy.unavailable}</p>
              <p className="text-xs text-muted-foreground">{copy.threads}: {system.liveThreads === null ? copy.unavailable : number.format(system.liveThreads)}</p>
            </div>
            <div className="space-y-2 rounded-xl border p-4">
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><HardDrive className="size-4" />{copy.memory}</p>
              <p className="text-xl font-semibold tabular-nums">{formatBytes(system.heapUsedBytes) ?? copy.unavailable}{system.heapMaxBytes !== null && <span className="text-sm font-normal text-muted-foreground"> / {formatBytes(system.heapMaxBytes)}</span>}</p>
              {heapRatio !== null && <Progress value={heapRatio} aria-label={copy.memory} />}
            </div>
            <div className="space-y-2 rounded-xl border p-4">
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><Cpu className="size-4" />{copy.cpu}</p>
              <p className="text-xl font-semibold tabular-nums">{system.processCpuUsage === null ? copy.unavailable : percent.format(system.processCpuUsage)}</p>
              <p className="text-xs text-muted-foreground">
                {copy.processCpu.replace('{value}', system.processCpuUsage === null ? '—' : percent.format(system.processCpuUsage))} · {copy.systemCpu.replace('{value}', system.systemCpuUsage === null ? '—' : percent.format(system.systemCpuUsage))}
              </p>
            </div>
            <div className="space-y-2 rounded-xl border p-4">
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><Database className="size-4" />{copy.dbPool}</p>
              <p className="text-xl font-semibold tabular-nums">{system.dbConnectionsActive === null ? copy.unavailable : number.format(system.dbConnectionsActive)}{system.dbConnectionsMax !== null && <span className="text-sm font-normal text-muted-foreground"> / {number.format(system.dbConnectionsMax)}</span>}</p>
              {poolRatio !== null && <Progress value={poolRatio} aria-label={copy.dbPool} />}
              <p className="text-xs text-muted-foreground">
                {copy.dbPoolSub.replace('{active}', String(system.dbConnectionsActive ?? '—')).replace('{idle}', String(system.dbConnectionsIdle ?? '—')).replace('{max}', String(system.dbConnectionsMax ?? '—'))}
                {(system.dbConnectionsPending ?? 0) > 0 && <span className="block font-medium text-destructive">{copy.dbPending.replace('{value}', String(system.dbConnectionsPending))}</span>}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{copy.checkedAt.replace('{time}', new Date(system.checkedAt).toLocaleTimeString(locale))}</p>
        </>}
      </CardContent>
    </Card>
  )
}
