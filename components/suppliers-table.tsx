'use client'

import { Trash2, Package, MoreHorizontal, AlertCircle, Eye, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/lib/language-context'
import { formatCurrency, getInitials } from '@/lib/utils'
import { Supplier } from '@/lib/types'

interface SuppliersTableProps {
  suppliers: Supplier[]
  onSelect: (supplier: Supplier) => void
  onEdit: (supplier: Supplier) => void
  onDelete: (id: string) => Promise<void>
  isDeleting: string | null
}

interface SupplierActionsProps {
  supplier: Supplier
  isDeleting: string | null
  onSelect: (supplier: Supplier) => void
  onEdit: (supplier: Supplier) => void
  onDelete: (id: string) => Promise<void>
}

function SupplierActionsMenu({ supplier, isDeleting, onSelect, onEdit, onDelete }: SupplierActionsProps) {
  const { t } = useLanguage()
  const ts = t.suppliers

  const handleDelete = async () => {
    if (window.confirm(ts.confirmeDeleteSupplier)) {
      await onDelete(supplier.id)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isDeleting === supplier.id}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(supplier) }}>
          <Eye className="mr-2 size-4" />
          {ts.viewDetails}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(supplier) }}>
          <Pencil className="mr-2 size-4" />
          {t.common.edit}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={(e) => { e.stopPropagation(); handleDelete() }}
        >
          <Trash2 className="mr-2 size-4" />
          {t.common.delete}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const debtClass = (debt: number) =>
  debt > 1000
    ? 'text-red-600 dark:text-red-400'
    : debt > 0
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-emerald-600 dark:text-emerald-400'

const rowBg = (debt: number) =>
  debt > 1000
    ? 'bg-red-50/50 dark:bg-red-950/20'
    : debt > 0
    ? 'bg-amber-50/30 dark:bg-amber-950/10'
    : ''

export function SuppliersTable({ suppliers, onSelect, onEdit, onDelete, isDeleting }: SuppliersTableProps) {
  const { t } = useLanguage()
  const ts = t.suppliers

  if (suppliers.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="flex h-32 flex-col items-center justify-center gap-2">
            <Package className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{ts.noSuppliers}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="flex flex-col overflow-hidden rounded-xl border sm:hidden">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className={`flex items-center gap-3 border-b p-4 last:border-b-0 ${rowBg(supplier.debtBalance) || 'bg-card'}`}
            onClick={() => onSelect(supplier)}
          >
            <Avatar className="size-9 shrink-0 border">
              <AvatarFallback className="bg-muted text-sm font-medium">
                {getInitials(supplier.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{supplier.name}</p>
              <p className="text-xs text-muted-foreground">{supplier.phone || '—'}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <div className="flex items-center gap-1">
                {supplier.debtBalance > 0 && <AlertCircle className="size-3.5 text-red-500" />}
                <span className={`font-mono text-sm font-semibold ${debtClass(supplier.debtBalance)}`}>
                  {formatCurrency(supplier.debtBalance)}
                </span>
              </div>
              <SupplierActionsMenu
                supplier={supplier}
                isDeleting={isDeleting}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
              />
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
                <TableHead className="w-[30%] pl-6">{ts.supplierName}</TableHead>
                <TableHead>{ts.phone}</TableHead>
                <TableHead>{ts.email}</TableHead>
                <TableHead>{ts.address}</TableHead>
                <TableHead>{ts.debtBalance}</TableHead>
                <TableHead className="pr-6 text-right"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow
                  key={supplier.id}
                  className={`cursor-pointer ${
                    supplier.debtBalance > 1000
                      ? 'bg-red-50/50 hover:bg-red-50 dark:bg-red-950/20 dark:hover:bg-red-950/30'
                      : supplier.debtBalance > 0
                      ? 'bg-amber-50/30 hover:bg-amber-50/50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20'
                      : ''
                  }`}
                  onClick={() => onSelect(supplier)}
                >
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 border">
                        <AvatarFallback className="bg-muted text-sm font-medium">
                          {getInitials(supplier.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{supplier.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">{supplier.code}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{supplier.phone || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{supplier.email || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{supplier.address || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {supplier.debtBalance > 0 && (
                        <AlertCircle className="size-4 text-red-500" />
                      )}
                      <span className={`font-mono text-sm font-semibold ${debtClass(supplier.debtBalance)}`}>
                        {formatCurrency(supplier.debtBalance)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <SupplierActionsMenu
                      supplier={supplier}
                      isDeleting={isDeleting}
                      onSelect={onSelect}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
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
