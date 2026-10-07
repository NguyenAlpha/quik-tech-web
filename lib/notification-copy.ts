'use client'

import { useLanguage } from '@/lib/language-context'

const copy = {
  vi: {
    title: 'Thông báo', description: 'Theo dõi cập nhật và những việc cần chú ý tại cửa hàng đang chọn.',
    all: 'Tất cả', unread: 'Chưa đọc', markRead: 'Đánh dấu đã đọc', markAll: 'Đọc tất cả',
    viewAll: 'Xem tất cả thông báo', open: 'Xem chi tiết', more: 'Xem thêm', refresh: 'Làm mới', retry: 'Thử lại',
    empty: 'Chưa có thông báo', emptyHint: 'Các cập nhật mới sẽ xuất hiện tại đây.',
    caughtUp: 'Bạn đã đọc hết thông báo', caughtUpHint: 'Chọn Tất cả để xem lại lịch sử.',
    loadError: 'Không tải được thông báo.', actionError: 'Không thể cập nhật trạng thái đã đọc.',
    loading: 'Đang tải thông báo…', resolved: 'Đã kết thúc', read: 'Đã đọc',
    alerts: 'Cần xử lý', stock: 'Mục tồn kho dưới ngưỡng', pending: 'Hóa đơn gói đang chờ xử lý',
    alertHint: 'Đánh dấu đã đọc không thay đổi tồn kho hoặc trạng thái thanh toán.',
    historyHint: 'Nội dung ghi nhận tại thời điểm phát sinh. Mở chi tiết để xem tình trạng hiện tại.',
    clearFilter: 'Bỏ lọc từ thông báo', missingInventory: 'Mục tồn kho này không còn trong cửa hàng hiện tại.',
    invoiceTitle: 'Hóa đơn từ thông báo', invoiceError: 'Không tải được hóa đơn được liên kết.', close: 'Đóng',
    types: { LOW_STOCK: 'Tồn kho dưới ngưỡng', INVOICE_PAID: 'Thanh toán gói đã được xác nhận', INVOICE_FAILED: 'Hóa đơn gói bị từ chối hoặc hết hạn', SUBSCRIPTION_EXPIRING: 'Gói dịch vụ sắp hết hạn', SUBSCRIPTION_EXPIRED: 'Gói dịch vụ đã hết hạn' },
  },
  en: {
    title: 'Notifications', description: 'Follow updates and items needing attention in the selected store.',
    all: 'All', unread: 'Unread', markRead: 'Mark as read', markAll: 'Read all',
    viewAll: 'View all notifications', open: 'View details', more: 'Load more', refresh: 'Refresh', retry: 'Retry',
    empty: 'No notifications yet', emptyHint: 'New updates will appear here.',
    caughtUp: 'You are all caught up', caughtUpHint: 'Choose All to revisit your history.',
    loadError: 'Could not load notifications.', actionError: 'Could not update read status.',
    loading: 'Loading notifications…', resolved: 'Resolved', read: 'Read',
    alerts: 'Needs attention', stock: 'Inventory entries below minimum', pending: 'Subscription invoices awaiting processing',
    alertHint: 'Marking as read does not change inventory or payment status.',
    historyHint: 'Details were recorded when the event occurred. Open the related page for the current status.',
    clearFilter: 'Clear notification filter', missingInventory: 'This inventory entry is no longer in the selected store.',
    invoiceTitle: 'Invoice from notification', invoiceError: 'Could not load the linked invoice.', close: 'Close',
    types: { LOW_STOCK: 'Stock below minimum', INVOICE_PAID: 'Subscription payment confirmed', INVOICE_FAILED: 'Subscription invoice rejected or expired', SUBSCRIPTION_EXPIRING: 'Subscription expires soon', SUBSCRIPTION_EXPIRED: 'Subscription expired' },
  },
}

export function useNotificationCopy() { return copy[useLanguage().language] }
