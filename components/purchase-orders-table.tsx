'use client'

import { Trash2, Package, Eye, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/lib/language-context'
import { PurchaseOrder, PurchaseOrderStatus } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'

interface PurchaseOrdersTableProps {
  purchaseOrders: PurchaseOrder[]
  onSelect: (po: PurchaseOrder) => void
  onDelete: (id: string) => Promise<void>
  onStatusChange: (id: string, status: PurchaseOrderStatus) => Promise<void>
  isDeleting: string | null
}

interface POActionsProps {
  po: PurchaseOrder
  isDeleting: string | null
  onSelect: (po: PurchaseOrder) => void
  onDelete: (id: string) => Promise<void>
}

function POActionsMenu({ po, isDeleting, onSelect, onDelete }: POActionsProps) {
  const { t } = useLanguage()
  const tpo = t.purchaseOrders

  const handleDelete = async () => {
    if (window.confirm(tpo.confirmDeletePO)) {
      await onDelete(po.id)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isDeleting === po.id} onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(po) }}>
          <Eye className="mr-2 size-4" />
          {tpo.viewDetails}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          disabled={isDeleting === po.id}
          onClick={(e) => { e.stopPropagation(); handleDelete() }}
        >
          <Trash2 className="mr-2 size-4" />
          {t.common.delete}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function PurchaseOrdersTable({
  purchaseOrders,
  onSelect,
  onDelete,
  onStatusChange,
  isDeleting,
}: PurchaseOrdersTableProps) {
  const { t } = useLanguage()
  const tpo = t.purchaseOrders

  const statusMap: Record<PurchaseOrderStatus, string> = {
    [PurchaseOrderStatus.PENDING]:   'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    [PurchaseOrderStatus.RECEIVED]:  'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    [PurchaseOrderStatus.CANCELLED]: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  }

  const statusLabelMap: Record<PurchaseOrderStatus, string> = {
    [PurchaseOrderStatus.PENDING]:   tpo.pending,
    [PurchaseOrderStatus.RECEIVED]:  tpo.received,
    [PurchaseOrderStatus.CANCELLED]: tpo.cancelled,
  }

  if (purchaseOrders.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="flex h-48 flex-col items-center justify-center gap-2">
            <Package className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{tpo.noPurchaseOrders}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="flex flex-col overflow-hidden rounded-xl border sm:hidden">
        {purchaseOrders.map((po) => (
          <div
            key={po.id}
            className={`flex items-center gap-3 border-b p-4 last:border-b-0 ${po.debtAmount > 0 ? 'bg-red-50/40 dark:bg-red-950/20' : 'bg-card'}`}
            onClick={() => onSelect(po)}
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{po.orderCode}</p>
              <p className="text-xs text-muted-foreground">{po.supplierName}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-xs font-semibold">{formatCurrency(po.totalAmount)}</span>
                {po.debtAmount > 0 && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="font-mono text-xs text-red-600 dark:text-red-400">
                      {tpo.debtAmount}: {formatCurrency(po.debtAmount)}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {po.status === PurchaseOrderStatus.PENDING ? (
                <Select onValueChange={(value) => onStatusChange(po.id, value as PurchaseOrderStatus)}>
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <span>{tpo.pending}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PurchaseOrderStatus.RECEIVED}>{tpo.received}</SelectItem>
                    <SelectItem value={PurchaseOrderStatus.CANCELLED}>{tpo.cancelled}</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={statusMap[po.status] ?? 'bg-gray-100 text-gray-600'}>
                  {statusLabelMap[po.status] ?? po.status}
                </Badge>
              )}
              <POActionsMenu po={po} isDeleting={isDeleting} onSelect={onSelect} onDelete={onDelete} />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="hidden sm:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">{tpo.poNumber}</TableHead>
                <TableHead>{tpo.supplier}</TableHead>
                <TableHead>{tpo.orderDate}</TableHead>
                <TableHead>{tpo.totalAmount}</TableHead>
                <TableHead>{tpo.status}</TableHead>
                <TableHead className="pr-6 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.map((po) => (
                <TableRow
                  key={po.id}
                  className={`cursor-pointer ${po.debtAmount > 0 ? 'bg-red-50/40 dark:bg-red-950/20' : ''}`}
                  onClick={() => onSelect(po)}
                >
                  <TableCell className="pl-6">
                    <span className="font-medium">{po.orderCode}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{po.supplierName}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {po.createdAt ? new Date(po.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono text-sm font-semibold">{formatCurrency(po.totalAmount)}</span>
                      {po.debtAmount > 0 && (
                        <span className="font-mono text-xs text-red-600 dark:text-red-400">
                          {tpo.debtAmount}: {formatCurrency(po.debtAmount)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    {po.status === PurchaseOrderStatus.PENDING ? (
                      <Select onValueChange={(value) => onStatusChange(po.id, value as PurchaseOrderStatus)}>
                        <SelectTrigger className="h-8 w-32">
                          <span className="text-sm">{tpo.pending}</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PurchaseOrderStatus.RECEIVED}>{tpo.received}</SelectItem>
                          <SelectItem value={PurchaseOrderStatus.CANCELLED}>{tpo.cancelled}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={statusMap[po.status] ?? 'bg-gray-100 text-gray-600'}>
                        {statusLabelMap[po.status] ?? po.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="pr-6 text-right" onClick={e => e.stopPropagation()}>
                    <POActionsMenu po={po} isDeleting={isDeleting} onSelect={onSelect} onDelete={onDelete} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
