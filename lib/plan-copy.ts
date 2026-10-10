'use client'

import { useLanguage } from '@/lib/language-context'

const copy = {
  en: {
    title: 'Plans & limits', description: 'Set the price and resource limits of each subscription plan.',
    pricingHint: 'Price changes apply to new invoices. Existing invoices keep the amount they were created with.',
    limitsHint: 'Limit changes apply immediately to every business on the plan.',
    edit: 'Edit plan', editTitle: 'Edit {plan} plan', save: 'Save plan',
    monthlyPrice: 'Monthly price (VND)', yearlyPrice: 'Yearly price (VND)', freePrice: 'The Free plan is always free.',
    maxStores: 'Stores', maxStaff: 'Employees', maxProducts: 'Products', maxWarehouses: 'Warehouses',
    unlimited: 'Unlimited', limits: 'Limits', pricing: 'Pricing', perMonth: '/ month', perYear: '/ year',
    affected: '{count} businesses use this plan', affectedFree: '{count} businesses use this plan (including expired subscriptions, which fall back to Free limits)',
    lowerWarning: 'Lowering a limit does not delete existing data. Businesses already above the new limit cannot create more until they are back under it.',
    saved: 'Plan updated.', reloadConflict: 'This plan changed. The list has been refreshed; reopen it to continue.',
    updatedAt: 'Updated', planConfigUpdated: 'Plan pricing/limits updated',
  },
  vi: {
    title: 'Gói & giới hạn', description: 'Thiết lập giá và giới hạn tài nguyên của từng gói đăng ký.',
    pricingHint: 'Thay đổi giá áp dụng cho hóa đơn mới. Hóa đơn đã tạo giữ nguyên số tiền lúc tạo.',
    limitsHint: 'Thay đổi giới hạn áp dụng ngay cho mọi doanh nghiệp đang dùng gói.',
    edit: 'Sửa gói', editTitle: 'Sửa gói {plan}', save: 'Lưu gói',
    monthlyPrice: 'Giá tháng (VND)', yearlyPrice: 'Giá năm (VND)', freePrice: 'Gói Free luôn miễn phí.',
    maxStores: 'Cửa hàng', maxStaff: 'Nhân viên', maxProducts: 'Sản phẩm', maxWarehouses: 'Kho hàng',
    unlimited: 'Không giới hạn', limits: 'Giới hạn', pricing: 'Giá', perMonth: '/ tháng', perYear: '/ năm',
    affected: '{count} doanh nghiệp đang dùng gói này', affectedFree: '{count} doanh nghiệp đang dùng gói này (gồm cả gói đã hết hạn, vốn dùng giới hạn của gói Free)',
    lowerWarning: 'Hạ giới hạn không xóa dữ liệu đang có. Doanh nghiệp đã vượt giới hạn mới sẽ không tạo thêm được cho đến khi về dưới mức giới hạn.',
    saved: 'Đã cập nhật gói.', reloadConflict: 'Gói này vừa được thay đổi. Danh sách đã được tải lại; hãy mở lại để tiếp tục.',
    updatedAt: 'Cập nhật', planConfigUpdated: 'Cập nhật giá/giới hạn gói',
  },
}

export function usePlanCopy() {
  const { language } = useLanguage()
  return copy[language]
}
