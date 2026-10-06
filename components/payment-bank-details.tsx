'use client'

import type { BankTransferInfo } from '@/lib/types'
import { usePaymentAccountCopy } from '@/lib/payment-account-copy'

export function PaymentBankDetails({ info }: { info: BankTransferInfo | null | undefined }) {
  const copy = usePaymentAccountCopy()
  if (!info) return <p className="text-sm text-muted-foreground">{copy.noSnapshot}</p>
  return <dl className="grid gap-3 text-sm sm:grid-cols-2">
    {[[copy.bankName, info.bankName], [copy.accountNumber, info.accountNumber], [copy.accountHolder, info.accountHolder], [copy.branch, info.branch]].map(([label, value]) => (
      <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value || '—'}</dd></div>
    ))}
  </dl>
}
