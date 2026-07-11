'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Pencil, Trash2, Building2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { TableFooter } from '@/components/table-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { useLanguage } from '@/lib/language-context'
import { PageSkeleton } from '@/components/page-skeleton'
import { PageError } from '@/components/page-error'
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse, ApiError } from '@/lib/api'
import type { Warehouse } from '@/lib/types'

type ModalState =
  | { mode: 'closed' }
  | { mode: 'add' }
  | { mode: 'edit'; warehouse: Warehouse }

export default function WarehousesPage() {
  const { t } = useLanguage()
  const tw = t.warehouses

  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })
  const [form, setForm] = useState({ name: '', address: '', isActive: true })
  const [error, setError] = useState<string | null>(null)

  const init = async () => {
    setIsPageLoading(true)
    setPageError(null)
    try {
      setWarehouses(await getWarehouses())
    } catch (err) {
      setPageError(err instanceof ApiError ? err.message : 'Failed to load data')
    } finally {
      setIsPageLoading(false)
    }
  }

  useEffect(() => { init() }, [])

  const filtered = useMemo(() =>
    warehouses.filter((w) => w.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [warehouses, searchQuery]
  )

  const openAdd = () => {
    setForm({ name: '', address: '', isActive: true })
    setError(null)
    setModal({ mode: 'add' })
  }

  const openEdit = (warehouse: Warehouse) => {
    setForm({ name: warehouse.name, address: warehouse.address, isActive: warehouse.isActive })
    setError(null)
    setModal({ mode: 'edit', warehouse })
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Name is required')
      return
    }
    setIsSaving(true)
    setError(null)
    const input = { name: form.name.trim(), address: form.address.trim() || undefined, isActive: form.isActive }
    try {
      if (modal.mode === 'add') {
        const created = await createWarehouse(input)
        setWarehouses((prev) => [...prev, created])
        toast.success(tw.created)
      } else if (modal.mode === 'edit') {
        const updated = await updateWarehouse(modal.warehouse.id, input)
        setWarehouses((prev) => prev.map((w) => (w.id === updated.id ? updated : w)))
        toast.success(tw.updated)
      }
      setModal({ mode: 'closed' })
    } catch (err) {
      setError(err instanceof Error ? err.message : tw.errorSave)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (warehouse: Warehouse) => {
    if (!window.confirm(tw.deleteConfirm)) return
    try {
      await deleteWarehouse(warehouse.id)
      setWarehouses((prev) => prev.filter((w) => w.id !== warehouse.id))
      toast.success(tw.deleted)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tw.errorDelete)
    }
  }

  if (isPageLoading) return <PageSkeleton />
  if (pageError) return <PageError message={pageError} onRetry={init} />

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-10">
      <PageHeader title={tw.title} subtitle={tw.subtitle}>
        <Button onClick={openAdd} className="gap-2 shadow-sm">
          <Plus className="size-4" />
          {tw.addNew}
        </Button>
      </PageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={tw.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">{tw.colName}</TableHead>
                <TableHead>{tw.colAddress}</TableHead>
                <TableHead>{tw.colStatus}</TableHead>
                <TableHead className="w-[100px] pr-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="size-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">{tw.noWarehouses}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((warehouse) => (
                  <TableRow key={warehouse.id}>
                    <TableCell className="pl-6 font-medium">{warehouse.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {warehouse.address || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={warehouse.isActive ? 'default' : 'secondary'}>
                        {warehouse.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(warehouse)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => handleDelete(warehouse)}>
                          <Trash2 className="size-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TableFooter filtered={filtered.length} total={warehouses.length} label={tw.warehouses} />

      <Dialog open={modal.mode !== 'closed'} onOpenChange={(open) => !open && setModal({ mode: 'closed' })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modal.mode === 'edit' ? tw.editWarehouse : tw.addNew}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wh-name">{tw.nameLabel}</Label>
              <Input
                id="wh-name"
                placeholder={tw.namePlaceholder}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wh-address">{tw.addressLabel}</Label>
              <Input
                id="wh-address"
                placeholder={tw.addressPlaceholder}
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="wh-active"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
              />
              <Label htmlFor="wh-active">{tw.activeLabel}</Label>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModal({ mode: 'closed' })} disabled={isSaving}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? t.common.loading : t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
