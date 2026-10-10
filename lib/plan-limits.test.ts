import { describe, expect, it } from 'vitest'
import { planLimitLines } from './plan-limits'
import { translations } from './translations'
import type { Plan } from './types'

const plan = (limits: Partial<Plan>): Plan => ({
  code: 'BASIC', monthlyPrice: 0, yearlyPrice: 0,
  maxStores: 2, maxStaff: 20, maxProducts: 200, maxWarehouses: 20, ...limits,
})

describe('planLimitLines', () => {
  it('formats counts with singular and plural forms', () => {
    expect(planLimitLines(plan({ maxStores: 1, maxWarehouses: 1 }), translations.en))
      .toEqual(['1 store', 'Up to 20 employees', '200 products', '1 warehouse'])
  })

  it('treats null as unlimited and 0 staff as owner only', () => {
    expect(planLimitLines(plan({ maxStaff: 0, maxProducts: null, maxWarehouses: null }), translations.vi))
      .toEqual(['2 cửa hàng', 'Chỉ chủ sở hữu (không có nhân viên)', 'Sản phẩm không giới hạn', 'Kho hàng không giới hạn'])
  })
})
