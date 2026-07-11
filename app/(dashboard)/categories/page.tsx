'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Pencil, Trash2, Tag } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { TableFooter } from '@/components/table-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useLanguage } from '@/lib/language-context'
import { PageSkeleton } from '@/components/page-skeleton'
import { PageError } from '@/components/page-error'
import { getCategories, createCategory, updateCategory, deleteCategory, ApiError } from '@/lib/api'
import type { Category, CreateCategoryInput } from '@/lib/types'

type ModalState =
  | { mode: 'closed' }
  | { mode: 'add' }
  | { mode: 'edit'; category: Category }

export default function CategoriesPage() {
  const { t } = useLanguage()
  const tc = t.categories

  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })
  const [form, setForm] = useState({ name: '', description: '' })
  const [error, setError] = useState<string | null>(null)

  const init = async () => {
    setIsPageLoading(true)
    setPageError(null)
    try {
      const cats = await getCategories()
      setCategories(cats)
    } catch (err) {
      setPageError(err instanceof ApiError ? err.message : 'Failed to load data')
    } finally {
      setIsPageLoading(false)
    }
  }

  useEffect(() => { init() }, [])

  const filtered = useMemo(() =>
    categories.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [categories, searchQuery]
  )

  const openAdd = () => {
    setForm({ name: '', description: '' })
    setError(null)
    setModal({ mode: 'add' })
  }

  const openEdit = (category: Category) => {
    setForm({ name: category.name, description: category.description })
    setError(null)
    setModal({ mode: 'edit', category })
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Name is required')
      return
    }
    setIsSaving(true)
    setError(null)
    const input: CreateCategoryInput = { name: form.name.trim(), description: form.description.trim() || undefined }
    try {
      if (modal.mode === 'add') {
        const created = await createCategory(input)
        setCategories((prev) => [...prev, created])
        toast.success(tc.created)
      } else if (modal.mode === 'edit') {
        const updated = await updateCategory(modal.category.id, input)
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        toast.success(tc.updated)
      }
      setModal({ mode: 'closed' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (category: Category) => {
    if (!window.confirm(tc.deleteConfirm)) return
    try {
      await deleteCategory(category.id)
      setCategories((prev) => prev.filter((c) => c.id !== category.id))
      toast.success(tc.deleted)
    } catch (err) {
      // 400 VALIDATION_ERROR: backend chặn xóa danh mục còn sản phẩm tham chiếu
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') {
        toast.error(tc.deleteBlockedInUse)
      } else {
        toast.error(err instanceof Error ? err.message : tc.errorDelete)
      }
    }
  }

  if (isPageLoading) return <PageSkeleton />
  if (pageError) return <PageError message={pageError} onRetry={init} />

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-10">
      <PageHeader title={tc.title} subtitle={tc.subtitle}>
        <Button onClick={openAdd} className="gap-2 shadow-sm">
          <Plus className="size-4" />
          {tc.addNew}
        </Button>
      </PageHeader>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={tc.searchPlaceholder}
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
                <TableHead className="pl-6">{tc.colName}</TableHead>
                <TableHead>{tc.colDescription}</TableHead>
                <TableHead className="w-[100px] pr-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Tag className="size-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">{tc.noCategories}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="pl-6 font-medium">{category.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {category.description || '—'}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(category)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => handleDelete(category)}>
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

      <TableFooter filtered={filtered.length} total={categories.length} label={tc.categories} />

      {/* Add / Edit Modal */}
      <Dialog open={modal.mode !== 'closed'} onOpenChange={(open) => !open && setModal({ mode: 'closed' })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modal.mode === 'edit' ? tc.editCategory : tc.addNew}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">{tc.nameLabel}</Label>
              <Input
                id="cat-name"
                placeholder={tc.namePlaceholder}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">{tc.descriptionLabel}</Label>
              <Textarea
                id="cat-desc"
                placeholder={tc.descriptionPlaceholder}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
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
