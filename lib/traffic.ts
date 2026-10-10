import { adminRequest } from '@/lib/admin-client'

export type TrafficRange = '1h' | '24h' | '7d' | '30d'

// Thời gian tính bằng ms; p50/p95/p99 là ước lượng, null khi không có request hoặc > 5000 ms
export interface TrafficReport {
  range: TrafficRange
  from: string
  to: string
  bucketSeconds: number
  summary: {
    requests: number
    requestsPerMinute: number
    serverErrors: number
    clientErrors: number
    rateLimited: number
    avgMs: number | null
    p50Ms: number | null
    p95Ms: number | null
    p99Ms: number | null
    maxMs: number
  }
  series: { time: string; requests: number; serverErrors: number; clientErrors: number; avgMs: number | null; p95Ms: number | null }[]
  statuses: { status: number; requests: number }[]
  endpoints: { method: string; route: string; requests: number; serverErrors: number; clientErrors: number; avgMs: number | null; p95Ms: number | null; maxMs: number }[]
  businesses: { businessId: number; businessName: string; requests: number; serverErrors: number; avgMs: number | null }[]
}

// Số đo tức thời của instance API trả lời request; trường null = không đo được
export interface SystemHealth {
  checkedAt: string
  status: string | null
  components: Record<string, string>
  uptimeSeconds: number | null
  heapUsedBytes: number | null
  heapMaxBytes: number | null
  processCpuUsage: number | null
  systemCpuUsage: number | null
  liveThreads: number | null
  dbConnectionsActive: number | null
  dbConnectionsIdle: number | null
  dbConnectionsMax: number | null
  dbConnectionsPending: number | null
}

export function getTrafficReport(range: TrafficRange) {
  return adminRequest<TrafficReport>(`/api/admin/traffic?range=${range}`)
}

export function getSystemHealth() {
  return adminRequest<SystemHealth>('/api/admin/traffic/system')
}
