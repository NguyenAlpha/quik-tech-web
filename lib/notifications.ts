import { apiFetch } from '@/lib/api'

export interface NotificationSummary {
  lowStockCount: number
  pendingInvoiceCount: number
  unreadCount: number
  latestId: number
}

export interface AppNotification {
  id: number
  type: 'LOW_STOCK' | 'INVOICE_PAID' | 'INVOICE_FAILED' | 'SUBSCRIPTION_EXPIRING' | 'SUBSCRIPTION_EXPIRED'
  subject: string
  detail: string | null
  targetPath: string
  createdAt: string
  read: boolean
  resolved: boolean
}

export interface NotificationPage { content: AppNotification[]; nextCursor: number | null }

const base = (storeId: number) => `/api/stores/${storeId}/notifications`
export const fetchNotificationSummary = (storeId: number, signal?: AbortSignal) =>
  apiFetch<NotificationSummary>(`${base(storeId)}/summary`, { signal })
export const fetchNotifications = (storeId: number, size: number, unreadOnly: boolean, cursor?: number | null, signal?: AbortSignal) =>
  apiFetch<NotificationPage>(`${base(storeId)}?size=${size}&unreadOnly=${unreadOnly}${cursor ? `&cursor=${cursor}` : ''}`, { signal })
export const readNotification = (storeId: number, id: number) =>
  apiFetch<void>(`${base(storeId)}/${id}/read`, { method: 'POST' })
export const readAllNotifications = (storeId: number, throughId: number) =>
  apiFetch<void>(`${base(storeId)}/read-all`, { method: 'POST', body: JSON.stringify({ throughId }) })

export function notificationTarget(item: AppNotification) {
  // Notification content can never redirect to an external URL or another app area.
  if (item.type === 'LOW_STOCK') return /^\/inventory\?item=[a-f0-9-]+$/.test(item.targetPath) ? item.targetPath : '/inventory'
  return /^\/subscription(?:\?invoiceId=\d+)?$/.test(item.targetPath) ? item.targetPath : '/subscription'
}
