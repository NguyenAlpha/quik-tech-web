import { ApiError } from '@/lib/api'
import type { AuthUser } from '@/lib/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export function clearAdminSession() {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
  document.cookie = 'admin_token=; path=/admin; max-age=0'
}

export async function adminRequest<T>(path: string, init?: RequestInit, accessToken?: string): Promise<T> {
  const token = accessToken ?? localStorage.getItem('admin_token')
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers })
  const body = await response.json().catch(() => null)
  if (!response.ok || !body?.success) {
    if (response.status === 401 && !accessToken) {
      clearAdminSession()
      window.location.assign('/admin/login')
    }
    throw new ApiError(body?.error?.code ?? 'UNKNOWN', body?.error?.message ?? 'Request failed', response.status)
  }
  return body.data
}

export function verifyAdminSession(accessToken?: string) {
  return adminRequest<AuthUser>('/api/admin/session', undefined, accessToken)
}
