import { ApiError } from '@/lib/api'
import type {
  AdminUser,
  AuthUser,
  Business,
  BusinessSubscription,
  PagedResult,
  SubscriptionInvoice
} from '@/lib/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export function clearAdminSession() {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
  document.cookie = 'admin_token=; path=/admin; max-age=0'
}

export async function adminRequest<T>(
  path: string,
  init?: RequestInit,
  accessToken?: string
): Promise<T> {
  const token = accessToken ?? localStorage.getItem('admin_token')
  const headers = new Headers(init?.headers)
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers })
  const body = await response.json().catch(() => null)
  if (!response.ok || !body?.success) {
    if (response.status === 401 && !accessToken) {
      clearAdminSession()
      window.location.assign('/admin/login')
    }
    throw new ApiError(
      body?.error?.code ?? 'UNKNOWN',
      body?.error?.message ?? 'Request failed',
      response.status
    )
  }
  return body.data
}

export function verifyAdminSession(accessToken?: string) {
  return adminRequest<AuthUser>('/api/admin/session', undefined, accessToken)
}

export interface AdminBusinessDetail {
  business: Business
  subscription: BusinessSubscription
  stores: Business[]
}

export function getAdminBusiness(businessId: number) {
  return adminRequest<AdminBusinessDetail>(
    `/api/admin/businesses/${businessId}`
  )
}

export function getAdminBusinessInvoices(businessId: number, page: number) {
  return adminRequest<PagedResult<SubscriptionInvoice>>(
    `/api/businesses/${businessId}/subscription/invoices?page=${page}&size=20`
  )
}

export function adminChangePlan(
  businessId: number,
  plan: string,
  billingCycle?: string,
  reason?: string
) {
  return adminRequest<BusinessSubscription>(
    `/api/admin/subscriptions/${businessId}/plan`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        plan,
        billingCycle,
        reason: reason?.trim() || undefined
      })
    }
  )
}

export function adminSetUserStatus(
  id: number,
  isActive: boolean,
  reason?: string
) {
  return adminRequest<AdminUser>(`/api/admin/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive, reason: reason?.trim() || undefined })
  })
}

export function adminDeleteUser(id: number, reason?: string) {
  return adminRequest<void>(`/api/admin/users/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason: reason?.trim() || undefined })
  })
}

export interface AdminAuditEntry {
  id: number
  actorId: number
  actorName: string
  businessId: number | null
  action: string
  entityType: string
  entityId: number
  reason: string | null
  before: Record<string, unknown>
  after: Record<string, unknown>
  createdAt: string
}

export interface AdminAuditPage {
  content: AdminAuditEntry[]
  nextCursor: number | null
}
