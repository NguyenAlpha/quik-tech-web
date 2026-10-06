'use client'

import { useLanguage } from '@/lib/language-context'

const copy = {
  en: {
    title: 'Receiving accounts', description: 'Manage the bank accounts used to collect subscription payments.',
    add: 'Add account', edit: 'Edit account', save: 'Save account', activate: 'Use for new invoices', archive: 'Archive',
    active: 'In use', available: 'Available', archived: 'Archived', all: 'All accounts',
    label: 'Account label', bankName: 'Bank', accountNumber: 'Account number', accountHolder: 'Account holder', branch: 'Branch (optional)',
    empty: 'No receiving accounts yet.', setup: 'Add an account, then select it to enable subscription payments.',
    noActive: 'No receiving account selected. New subscription payments are currently unavailable.',
    futureOnly: 'Changes apply to new invoices. Existing invoices keep their saved receiving details.',
    editHint: 'Use a label that helps your team distinguish this account. Editing details does not change existing invoices.',
    switchTitle: 'Change receiving account?', previous: 'Current account', next: 'New account', none: 'None selected',
    switchHint: 'New invoices will use the account below. Customers with existing invoices continue paying to their saved account.',
    archiveTitle: 'Archive this account?', archiveHint: 'This account will no longer be available for selection. Existing invoice details stay unchanged.',
    archiveActiveHint: 'Choose another receiving account before archiving this one.',
    created: 'Account added. Select it when you are ready to receive payments.', saved: 'Account updated.',
    activated: 'Receiving account changed.', archivedSuccess: 'Account archived.',
    reloadConflict: 'This account changed. The list has been refreshed; reopen it to continue.',
    snapshotTitle: 'Receiving account for this invoice', noSnapshot: 'Receiving details were not saved for this invoice. Contact support before transferring money.',
    unavailable: 'Subscription payments are temporarily unavailable. Please contact support or try again later.',
    availabilityError: 'Could not load payment availability. Please retry.',
    accountCreated: 'Receiving account added', accountUpdated: 'Receiving account edited',
    accountActivated: 'Receiving account switched', accountArchived: 'Receiving account archived',
    version: 'Version', bankInfo: 'Receiving details', paymentAccountId: 'Receiving account ID',
    copyNumber: 'Copy account number', copied: 'Account number copied', copyError: 'Could not copy. Please copy the account number manually.'
  },
  vi: {
    title: 'Tài khoản nhận tiền', description: 'Quản lý các tài khoản ngân hàng nhận thanh toán gói dịch vụ.',
    add: 'Thêm tài khoản', edit: 'Sửa tài khoản', save: 'Lưu tài khoản', activate: 'Dùng cho hóa đơn mới', archive: 'Lưu trữ',
    active: 'Đang sử dụng', available: 'Có thể sử dụng', archived: 'Đã lưu trữ', all: 'Tất cả tài khoản',
    label: 'Tên gợi nhớ', bankName: 'Ngân hàng', accountNumber: 'Số tài khoản', accountHolder: 'Chủ tài khoản', branch: 'Chi nhánh (không bắt buộc)',
    empty: 'Chưa có tài khoản nhận tiền.', setup: 'Thêm tài khoản, sau đó chọn sử dụng để mở thanh toán gói dịch vụ.',
    noActive: 'Chưa chọn tài khoản nhận tiền. Hiện chưa thể tạo thanh toán gói dịch vụ mới.',
    futureOnly: 'Thay đổi áp dụng cho hóa đơn mới. Hóa đơn đã tạo giữ nguyên thông tin nhận tiền đã lưu.',
    editHint: 'Đặt tên gợi nhớ để dễ phân biệt tài khoản. Sửa thông tin không làm thay đổi hóa đơn đã tạo.',
    switchTitle: 'Chuyển tài khoản nhận tiền?', previous: 'Tài khoản hiện tại', next: 'Tài khoản mới', none: 'Chưa chọn',
    switchHint: 'Hóa đơn mới sẽ dùng tài khoản bên dưới. Khách có hóa đơn trước đó tiếp tục thanh toán vào tài khoản đã lưu trên hóa đơn.',
    archiveTitle: 'Lưu trữ tài khoản này?', archiveHint: 'Tài khoản sẽ không còn trong danh sách có thể chọn. Thông tin nhận tiền trên hóa đơn cũ được giữ nguyên.',
    archiveActiveHint: 'Chọn tài khoản nhận tiền khác trước khi lưu trữ tài khoản này.',
    created: 'Đã thêm tài khoản. Chọn sử dụng khi bạn sẵn sàng nhận thanh toán.', saved: 'Đã cập nhật tài khoản.',
    activated: 'Đã chuyển tài khoản nhận tiền.', archivedSuccess: 'Đã lưu trữ tài khoản.',
    reloadConflict: 'Thông tin tài khoản đã thay đổi. Danh sách đã được tải lại; hãy mở lại tài khoản để tiếp tục.',
    snapshotTitle: 'Tài khoản nhận tiền của hóa đơn', noSnapshot: 'Hóa đơn chưa lưu thông tin nhận tiền. Vui lòng liên hệ hỗ trợ trước khi chuyển khoản.',
    unavailable: 'Thanh toán gói dịch vụ tạm thời chưa khả dụng. Vui lòng liên hệ hỗ trợ hoặc thử lại sau.',
    availabilityError: 'Không tải được thông tin thanh toán. Vui lòng thử lại.',
    accountCreated: 'Thêm tài khoản nhận tiền', accountUpdated: 'Sửa tài khoản nhận tiền',
    accountActivated: 'Chuyển tài khoản nhận tiền', accountArchived: 'Lưu trữ tài khoản nhận tiền',
    version: 'Phiên bản', bankInfo: 'Thông tin nhận tiền', paymentAccountId: 'Mã tài khoản nhận tiền',
    copyNumber: 'Sao chép số tài khoản', copied: 'Đã sao chép số tài khoản', copyError: 'Không thể sao chép. Vui lòng sao chép số tài khoản thủ công.'
  }
}

export function usePaymentAccountCopy() {
  return copy[useLanguage().language]
}
