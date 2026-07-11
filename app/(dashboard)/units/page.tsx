'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Pencil, Trash2, Ruler } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { TableFooter } from '@/components/table-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useLanguage } from '@/lib/language-context'
import { PageSkeleton } from '@/components/page-skeleton'
import { getUnits, createUnit, updateUnit, deleteUnit, ApiError } from '@/lib/api'
import type { Unit, CreateUnitInput } from '@/lib/types'

type ModalState =
  | { mode: 'closed' }
  | { mode: 'add' }
  | { mode: 'edit'; unit: Unit }

export default function UnitsPage() {
  const { t } = useLanguage()
  const tu = t.units

  const [units, setUnits] = useState<Unit[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })
  const [form, setForm] = useState({ name: '', abbreviation: '' })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getUnits()
      .then(setUnits)
      .finally(() => setIsPageLoading(false))
  }, [])

  const filtered = useMemo(() =>
    units.filter((u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [units, searchQuery]
  )

  const openAdd = () => {
    setForm({ name: '', abbreviation: '' })
    setError(null)
    setModal({ mode: 'add' })
  }

  const openEdit = (unit: Unit) => {
    setForm({ name: unit.name, abbreviation: unit.abbreviation })
    setError(null)
    setModal({ mode: 'edit', unit })
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    if (!form.abbreviation.trim()) { setError('Abbreviation is required'); return }
    setIsSaving(true)
    setError(null)
    const input: CreateUnitInput = { name: form.name.trim(), abbreviation: form.abbreviation.trim() }
    try {
      if (modal.mode === 'add') {
        const created = await createUnit(input)
        setUnits((prev) => [...prev, created])
        toast.success(tu.created)
      } else if (modal.mode === 'edit') {
        const updated = await updateUnit(modal.unit.id, input)
        setUnits((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
        toast.success(tu.updated)
      }
      setModal({ mode: 'closed' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (unit: Unit) => {
    if (!window.confirm(tu.deleteConfirm)) return
    try {
      await deleteUnit(unit.id)
      setUnits((prev) => prev.filter((u) => u.id !== unit.id))
      toast.success(tu.deleted)
    } catch (err) {
      // 400 VALIDATION_ERROR: backend chặn xóa đơn vị còn sản phẩm tham chiếu
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') {
        toast.error(tu.deleteBlockedInUse)
      } else {
        toast.error(err instanceof Error ? err.message : tu.errorDelete)
      }
    }
  }

  if (isPageLoading) return <PageSkeleton />

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-10">
      <PageHeader title={tu.title} subtitle={tu.subtitle}>
        <Button onClick={openAdd} className="gap-2 shadow-sm">
          <Plus className="size-4" />
          {tu.addNew}
        </Button>
      </PageHeader>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={tu.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">{tu.colName}</TableHead>
                <TableHead>{tu.colAbbreviation}</TableHead>
                <TableHead className="w-[100px] pr-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Ruler className="size-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">{tu.noUnits}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((unit) => (
                  <TableRow key={unit.id} className="group">
                    <TableCell className="pl-6 font-medium">{unit.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-sm font-medium">
                        {unit.abbreviation}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(unit)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => handleDelete(unit)}>
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

      <TableFooter filtered={filtered.length} total={units.length} label={tu.units} />

      {/* Add / Edit Modal */}
      <Dialog open={modal.mode !== 'closed'} onOpenChange={(open) => !open && setModal({ mode: 'closed' })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{modal.mode === 'edit' ? tu.editUnit : tu.addNew}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unit-name">{tu.nameLabel}</Label>
              <Input
                id="unit-name"
                placeholder={tu.namePlaceholder}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-abbr">{tu.abbreviationLabel}</Label>
              <Input
                id="unit-abbr"
                placeholder={tu.abbreviationPlaceholder}
                value={form.abbreviation}
                onChange={(e) => setForm((p) => ({ ...p, abbreviation: e.target.value }))}
              />
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
