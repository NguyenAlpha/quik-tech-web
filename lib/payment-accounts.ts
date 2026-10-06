import { adminRequest } from '@/lib/admin-client'
import type { BankTransferInfo } from '@/lib/types'

export interface PaymentAccount extends BankTransferInfo {
  id: number
  label: string
  active: boolean
  archived: boolean
  version: number
  createdAt: string
  updatedAt: string
}

export interface PaymentAccountInput extends BankTransferInfo {
  label: string
  version?: number
  reason?: string
}

export function getPaymentAccounts() {
  return adminRequest<PaymentAccount[]>('/api/admin/payment-accounts')
}

export function savePaymentAccount(input: PaymentAccountInput, id?: number) {
  return adminRequest<PaymentAccount>(`/api/admin/payment-accounts${id === undefined ? '' : `/${id}`}`, {
    method: id === undefined ? 'POST' : 'PUT', body: JSON.stringify(input)
  })
}

export function changePaymentAccount(account: PaymentAccount, action: 'activate' | 'archive', reason: string) {
  return adminRequest<PaymentAccount>(`/api/admin/payment-accounts/${account.id}/${action}`, {
    method: 'POST', body: JSON.stringify({ version: account.version, reason: reason.trim() || undefined })
  })
}
