import { adminRequest } from '@/lib/admin-client'
import type { Plan } from '@/lib/types'

export interface AdminPlan extends Plan {
  version: number
  updatedAt: string
  // Số business có giới hạn bị cập nhật ngay khi sửa gói này
  affectedBusinesses: number
}

export interface AdminPlanInput {
  monthlyPrice: number
  yearlyPrice: number
  maxStores: number | null
  maxStaff: number | null
  maxProducts: number | null
  maxWarehouses: number | null
  version: number
  reason?: string
}

export function getAdminPlans() {
  return adminRequest<AdminPlan[]>('/api/admin/plans')
}

export function updateAdminPlan(code: Plan['code'], input: AdminPlanInput) {
  return adminRequest<AdminPlan>(`/api/admin/plans/${code}`, { method: 'PUT', body: JSON.stringify(input) })
}
