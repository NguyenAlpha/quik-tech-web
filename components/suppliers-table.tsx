'use client'

import { Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/language-context'
import { Supplier } from '@/lib/types'

interface SuppliersTableProps {
  suppliers: Supplier[]
  onDelete: (id: string) => Promise<void>
  isDeleting: string | null
}

export function SuppliersTable({ suppliers, onDelete, isDeleting }: SuppliersTableProps) {
  const { t } = useLanguage()

  const handleDelete = async (id: string) => {
    if (window.confirm(t.suppliers.confirmeDeleteSupplier)) {
      await onDelete(id)
    }
  }

  if (suppliers.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Package className="size-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{t.suppliers.noSuppliers}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.suppliers.supplierName}
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.suppliers.city}
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.suppliers.email}
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.suppliers.phone}
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.suppliers.contactPerson}
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.suppliers.paymentTerms}
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.suppliers.totalInvoiceValue}
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.products.status}
            </TableHead>
            <TableHead className="pr-6 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier.id} className="group">
              <TableCell className="pl-6">
                <span className="font-medium">{supplier.name}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">{supplier.city}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">{supplier.email}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">{supplier.phone}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">{supplier.contactPerson}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">{supplier.paymentTerms}</span>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm font-semibold">
                  ${supplier.totalInvoiceValue.toLocaleString()}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={supplier.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}>
                  {supplier.isActive ? t.products.active : t.products.inactive}
                </Badge>
              </TableCell>
              <TableCell className="pr-6 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 opacity-0 group-hover:opacity-100"
                  onClick={() => handleDelete(supplier.id)}
                  disabled={isDeleting === supplier.id}
                >
                  <Trash2 className="size-4 text-red-600" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
