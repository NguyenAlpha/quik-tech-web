import type { Plan } from './types'
import type { Translations } from './translations'

// Dựng các dòng "50 sản phẩm", "Tối đa 20 nhân viên"… từ giới hạn của gói (null = không giới hạn)
export function planLimitLines(plan: Plan, t: Translations): string[] {
  const l = t.planLimits
  const line = (n: number | null, one: string, many: string, unlimited: string) =>
    n === null ? unlimited : (n === 1 ? one : many).replace('{n}', n.toLocaleString())
  return [
    line(plan.maxStores, l.storesOne, l.stores, l.storesUnlimited),
    plan.maxStaff === 0 ? l.staffNone : line(plan.maxStaff, l.staff, l.staff, l.staffUnlimited),
    line(plan.maxProducts, l.productsOne, l.products, l.productsUnlimited),
    line(plan.maxWarehouses, l.warehousesOne, l.warehouses, l.warehousesUnlimited),
  ]
}
