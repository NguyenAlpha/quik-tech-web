import { adminRequest } from '@/lib/admin-client'
import type { BankTransferInfo } from '@/lib/types'

export interface PaymentAccount extends BankTransferInfo {
  qrImageKey: string | null
  id: number
  label: string
  active: boolean
  archived: boolean
  version: number
  createdAt: string
  updatedAt: string
}

export interface PaymentAccountInput extends BankTransferInfo {
  qrImageKey: string | null
  qrConfirmed: boolean
  label: string
  version?: number
  reason?: string
}

export function getPaymentAccounts() {
  return adminRequest<PaymentAccount[]>('/api/admin/payment-accounts')
}

export async function uploadPaymentQr(file: File) {
  let image: Blob = file
  // Browsers decode WebP; the backend validates and stores a lossless PNG.
  if (file.type === 'image/webp') {
    const bitmap = await createImageBitmap(file)
    try {
      if (bitmap.width > 4096 || bitmap.height > 4096) throw new Error('QR image dimensions must not exceed 4096 x 4096')
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Could not read QR image')
      context.drawImage(bitmap, 0, 0)
      image = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not read QR image')), 'image/png'))
    } finally {
      bitmap.close()
    }
  }
  if (image.size > 5 * 1024 * 1024) throw new Error('Decoded QR image exceeds 5 MB; use a smaller image')
  return adminRequest<{ qrImageKey: string; qrImageUrl: string }>('/api/admin/payment-accounts/qr', {
    method: 'POST', headers: { 'Content-Type': image.type }, body: image
  })
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
