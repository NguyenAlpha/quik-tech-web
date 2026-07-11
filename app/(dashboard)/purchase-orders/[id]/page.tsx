'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/language-context'
import { PurchaseOrder, PurchaseOrderStatus } from '@/lib/types'
import { getPurchaseOrder } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

const STATUS_CLASSES: Record<PurchaseOrderStatus, string> = {
  [PurchaseOrderStatus.PENDING]:   'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  [PurchaseOrderStatus.RECEIVED]:  'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  [PurchaseOrderStatus.CANCELLED]: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { t } = useLanguage()
  const tpo = t.purchaseOrders

  const [po, setPo] = useState<PurchaseOrder | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)

  useEffect(() => {
    getPurchaseOrder(id)
      .then(setPo)
      .catch(() => toast.error(tpo.errorLoadingPO))
      .finally(() => setIsPageLoading(false))
  }, [id])

  if (isPageLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">{t.common.loading}</p>
      </div>
    )
  }

  if (!po) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">{tpo.detailNotFound}</p>
      </div>
    )
  }

  const statusLabel: Record<PurchaseOrderStatus, string> = {
    [PurchaseOrderStatus.PENDING]:   tpo.pending,
    [PurchaseOrderStatus.RECEIVED]:  tpo.received,
    [PurchaseOrderStatus.CANCELLED]: tpo.cancelled,
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:p-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{po.orderCode}</h1>
              <Badge className={STATUS_CLASSES[po.status]}>
                {statusLabel[po.status]}
              </Badge>
            </div>
            <p className="font-mono text-sm text-muted-foreground">{po.id}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tpo.detailOrderInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label={tpo.poNumber} value={<span className="font-medium">{po.orderCode}</span>} />
            <Row label={tpo.supplier} value={<span className="font-mono text-sm">{po.supplierPublicId}</span>} />
            <Row label={tpo.warehouse} value={<span className="font-mono text-sm">{po.warehousePublicId}</span>} />
            <Row label={tpo.orderDate} value={po.createdAt ? new Date(po.createdAt).toLocaleString() : '—'} />
            {po.note && (
              <div className="pt-1">
                <p className="mb-1 text-sm text-muted-foreground">{tpo.notes}</p>
                <p className="text-sm">{po.note}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tpo.detailPaymentInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row
              label={tpo.totalAmount}
              value={<span className="font-mono font-semibold">{formatCurrency(po.totalAmount)}</span>}
            />
            <Row
              label={tpo.paidAmount}
              value={<span className="font-mono text-blue-600 dark:text-blue-400">{formatCurrency(po.paidAmount)}</span>}
            />
            <Row
              label={tpo.debtAmount}
              value={
                <span className={`font-mono font-medium ${po.debtAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                  {formatCurrency(po.debtAmount)}
                </span>
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tpo.items} ({po.items.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {po.items.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">{tpo.noPurchaseOrders}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-6 py-3 font-medium">{t.products.productName}</th>
                    <th className="px-6 py-3 font-medium text-right">{tpo.quantity}</th>
                    <th className="px-6 py-3 font-medium text-right">{tpo.unitPrice}</th>
                    <th className="px-6 py-3 font-medium text-right">{tpo.totalPrice}</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items.map((item, idx) => (
                    <tr key={`${item.productPublicId}-${idx}`} className="border-b last:border-0">
                      <td className="px-6 py-3 font-medium">{item.productName}</td>
                      <td className="px-6 py-3 text-right font-mono">{item.quantity}</td>
                      <td className="px-6 py-3 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-6 py-3 text-right font-mono font-semibold">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/30">
                    <td className="px-6 py-3 font-medium" colSpan={3}>{tpo.totalAmount}</td>
                    <td className="px-6 py-3 text-right font-mono font-bold">{formatCurrency(po.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}
