'use client'

import type { BankTransferInfo } from '@/lib/types'
import { usePaymentAccountCopy } from '@/lib/payment-account-copy'
import { PaymentQrImage } from '@/components/payment-qr-image'

export function PaymentBankDetails({ info }: { info: BankTransferInfo | null | undefined }) {
  const copy = usePaymentAccountCopy()
  if (!info) return <p className="text-sm text-muted-foreground">{copy.noSnapshot}</p>
  return <div className="space-y-4"><dl className="grid gap-3 text-sm sm:grid-cols-2">
    {[[copy.bankName, info.bankName], [copy.accountNumber, info.accountNumber], [copy.accountHolder, info.accountHolder], [copy.branch, info.branch]].map(([label, value]) => (
      <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value || '—'}</dd></div>
    ))}
  </dl>{info.qrImageUrl && <div className="space-y-2 border-t pt-4"><p className="text-sm font-medium">{copy.qrImage}</p><PaymentQrImage key={info.qrImageUrl} url={info.qrImageUrl} /><p className="text-xs text-muted-foreground">{copy.qrPaymentHint}</p></div>}</div>
}
