'use client'

import { Trash2, ChevronDown, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/language-context'
import { PurchaseOrder } from '@/lib/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'

interface PurchaseOrdersTableProps {
  purchaseOrders: PurchaseOrder[]
  onDelete: (id: string) => Promise<void>
  onStatusChange: (id: string, status: 'pending' | 'received' | 'completed') => Promise<void>
  isDeleting: string | null
}

export function PurchaseOrdersTable({
  purchaseOrders,
  onDelete,
  onStatusChange,
  isDeleting,
}: PurchaseOrdersTableProps) {
  const { t } = useLanguage()
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      received: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    }
    const displayMap = {
      pending: t.purchaseOrders.pending,
      received: t.purchaseOrders.received,
      completed: t.purchaseOrders.completed,
    }
    return { className: statusMap[status as keyof typeof statusMap], label: displayMap[status as keyof typeof displayMap] }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm(t.purchaseOrders.confirmDeletePO)) {
      await onDelete(id)
    }
  }

  if (purchaseOrders.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Package className="size-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{t.purchaseOrders.noPurchaseOrders}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-8" />
            <TableHead className="pl-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.purchaseOrders.poNumber}
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.purchaseOrders.supplier}
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.purchaseOrders.orderDate}
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.purchaseOrders.expectedDeliveryDate}
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.purchaseOrders.itemsCount}
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.purchaseOrders.totalAmount}
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.purchaseOrders.status}
            </TableHead>
            <TableHead className="pr-6 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchaseOrders.map((po) => {
            const isExpanded = expandedRows.has(po.id)
            const statusBadge = getStatusBadge(po.status)
            return (
              <TableRow key={po.id} className="group">
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0"
                    onClick={() => toggleRow(po.id)}
                  >
                    <ChevronDown
                      className={`size-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </Button>
                </TableCell>
                <TableCell className="pl-6">
                  <span className="font-medium">{po.poNumber}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{po.supplierName}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{po.orderDate}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{po.expectedDeliveryDate}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">{po.items.length} {t.purchaseOrders.itemsCount}</span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm font-semibold">${po.totalAmount.toLocaleString()}</span>
                </TableCell>
                <TableCell>
                  <Select value={po.status} onValueChange={(value: any) => onStatusChange(po.id, value)}>
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{t.purchaseOrders.pending}</SelectItem>
                      <SelectItem value="received">{t.purchaseOrders.received}</SelectItem>
                      <SelectItem value="completed">{t.purchaseOrders.completed}</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 opacity-0 group-hover:opacity-100"
                    onClick={() => handleDelete(po.id)}
                    disabled={isDeleting === po.id}
                  >
                    <Trash2 className="size-4 text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}

          {purchaseOrders.length > 0 && purchaseOrders.map((po) => {
            const isExpanded = expandedRows.has(po.id)
            return isExpanded ? (
              <TableRow key={`${po.id}-expanded`}>
                <TableCell colSpan={9} className="bg-muted/30 p-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">{t.purchaseOrders.items}</h4>
                      <div className="space-y-2 text-sm">
                        {po.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center">
                            <span>{item.productName}</span>
                            <div className="flex gap-8">
                              <span className="text-muted-foreground">Qty: {item.quantity}</span>
                              <span className="text-muted-foreground">${item.unitPrice.toFixed(2)}</span>
                              <span className="font-medium">${item.totalPrice.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {po.notes && (
                      <div>
                        <h4 className="font-semibold mb-1 text-sm">{t.purchaseOrders.notes}</h4>
                        <p className="text-sm text-muted-foreground">{po.notes}</p>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : null
          })}
        </TableBody>
      </Table>
    </div>
  )
}
