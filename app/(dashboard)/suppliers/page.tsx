'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Building2, AlertCircle, Mail, Phone, MapPin, X, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { TableFooter } from '@/components/table-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/lib/language-context'
import { PageSkeleton } from '@/components/page-skeleton'
import { PageError } from '@/components/page-error'
import { SuppliersTable } from '@/components/suppliers-table'
import { Supplier, CreateSupplierInput, PurchaseOrder } from '@/lib/types'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, paySupplier, getPurchaseOrdersPage, ApiError } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

const emptyForm = { name: '', code: '', phone: '', email: '', address: '' }

export default function SuppliersPage() {
  const { t } = useLanguage()
  const ts = t.suppliers

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [debtFilter, setDebtFilter] = useState<string>('all')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [isFormLoading, setIsFormLoading] = useState(false)

  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isPayOpen, setIsPayOpen] = useState(false)
  const [payAmount, setPayAmount] = useState(0)
  const [isPayLoading, setIsPayLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)

  const [supplierPOs, setSupplierPOs] = useState<PurchaseOrder[]>([])
  const [isPOsLoading, setIsPOsLoading] = useState(false)

  const init = async () => {
    setIsPageLoading(true)
    setPageError(null)
    try {
      setSuppliers(await getSuppliers())
    } catch (err) {
      setPageError(err instanceof ApiError ? err.message : 'Failed to load data')
    } finally {
      setIsPageLoading(false)
    }
  }

  useEffect(() => {
    if (refreshKey === 0) { init(); return }
    getSuppliers().then(setSuppliers).catch(() => {}).finally(() => setIsPageLoading(false))
  }, [refreshKey])

  useEffect(() => {
    if (!selectedSupplier) { setSupplierPOs([]); return }
    setIsPOsLoading(true)
    getPurchaseOrdersPage({ page: 0, size: 5, supplierPublicId: selectedSupplier.id })
      .then(r => setSupplierPOs(r.content))
      .catch(() => setSupplierPOs([]))
      .finally(() => setIsPOsLoading(false))
  }, [selectedSupplier?.id])

  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return suppliers.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q)
      const matchesDebt =
        debtFilter === 'all' ||
        (debtFilter === 'with_debt' && s.debtBalance > 0) ||
        (debtFilter === 'no_debt' && s.debtBalance === 0)
      return matchesSearch && matchesDebt
    })
  }, [suppliers, searchQuery, debtFilter])

  const totalDebt = useMemo(() => suppliers.reduce((sum, s) => sum + s.debtBalance, 0), [suppliers])
  const suppliersWithDebt = useMemo(() => suppliers.filter((s) => s.debtBalance > 0).length, [suppliers])

  const handleOpenCreate = () => {
    setEditingSupplier(null)
    setFormData(emptyForm)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      code: supplier.code,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
    })
    setSelectedSupplier(null)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsFormLoading(true)
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData)
        toast.success(ts.supplierUpdated)
      } else {
        await createSupplier(formData)
        toast.success(ts.supplierAdded)
      }
      setIsFormOpen(false)
      setRefreshKey((k) => k + 1)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : editingSupplier ? ts.errorUpdatingSupplier : ts.errorAddingSupplier)
    } finally {
      setIsFormLoading(false)
    }
  }

  const handlePaySupplier = async () => {
    if (!selectedSupplier || payAmount <= 0) return
    setIsPayLoading(true)
    try {
      const updated = await paySupplier(selectedSupplier.id, payAmount)
      toast.success(ts.supplierPaid)
      setIsPayOpen(false)
      setPayAmount(0)
      setSelectedSupplier(updated)
      setRefreshKey((k) => k + 1)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : ts.errorPayingSupplier)
    } finally {
      setIsPayLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      await deleteSupplier(id)
      toast.success(ts.supplierDeleted)
      setRefreshKey((k) => k + 1)
    } catch (error) {
      // 400 VALIDATION_ERROR: backend chặn xóa nhà cung cấp còn công nợ
      if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
        toast.error(ts.deleteBlockedHasDebt)
      } else {
        toast.error(error instanceof ApiError ? error.message : ts.errorDeletingSupplier)
      }
    } finally {
      setIsDeleting(null)
    }
  }

  if (isPageLoading) return <PageSkeleton />
  if (pageError) return <PageError message={pageError} onRetry={init} />

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-10">
      <PageHeader title={ts.title} subtitle={ts.subtitle}>
        <Button onClick={handleOpenCreate} className="gap-2 shadow-sm">
          <Plus className="size-4" />
          {ts.addSupplier}
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
              <Building2 className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">{ts.totalSuppliers}</p>
              <p className="text-2xl font-semibold tracking-tight">{suppliers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950">
              <AlertCircle className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">{ts.suppliersWithDebt}</p>
              <p className="text-2xl font-semibold tracking-tight">{suppliersWithDebt}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
              <span className="text-lg font-semibold text-red-600 dark:text-red-400">₫</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">{ts.totalOutstanding}</p>
              <p className="text-2xl font-semibold tracking-tight text-red-600 dark:text-red-400">
                {formatCurrency(totalDebt)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={ts.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <Select value={debtFilter} onValueChange={setDebtFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[160px]">
            <SelectValue placeholder={ts.allBalances} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ts.allBalances}</SelectItem>
            <SelectItem value="with_debt">{ts.withDebt}</SelectItem>
            <SelectItem value="no_debt">{ts.noDebt}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SuppliersTable
        suppliers={filteredSuppliers}
        onSelect={setSelectedSupplier}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <TableFooter filtered={filteredSuppliers.length} total={suppliers.length} label={ts.suppliers} />

      {/* Supplier Detail Modal */}
      <Dialog
        open={!!selectedSupplier}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSupplier(null)
            setIsPayOpen(false)
            setPayAmount(0)
          }
        }}
      >
        <DialogContent className="w-full max-w-lg sm:max-w-2xl p-0" showCloseButton={false} aria-describedby={undefined}>
          {selectedSupplier && (
            <>
              <DialogHeader className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-12 border-2">
                      <AvatarFallback className="bg-muted text-base font-medium">
                        {getInitials(selectedSupplier.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-lg">{selectedSupplier.name}</DialogTitle>
                      <p className="font-mono text-sm text-muted-foreground">{selectedSupplier.code}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setSelectedSupplier(null)}
                  >
                    <X className="size-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-6 p-6">
                {selectedSupplier.debtBalance > 0 && (
                  <div
                    className={`flex items-center gap-3 rounded-lg border p-4 ${
                      selectedSupplier.debtBalance > 1000
                        ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50'
                        : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50'
                    }`}
                  >
                    <AlertCircle
                      className={`size-5 ${
                        selectedSupplier.debtBalance > 1000
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${selectedSupplier.debtBalance > 1000 ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'}`}>
                        {ts.modalOutstandingBalance}
                      </p>
                      <p className={`text-2xl font-bold ${selectedSupplier.debtBalance > 1000 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {formatCurrency(selectedSupplier.debtBalance)}
                      </p>
                    </div>
                    {isPayOpen ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0.01}
                          max={selectedSupplier.debtBalance}
                          step={0.01}
                          value={payAmount}
                          onChange={(e) => setPayAmount(Number(e.target.value))}
                          className="h-9 w-32 text-sm"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={handlePaySupplier}
                          disabled={isPayLoading || payAmount <= 0 || payAmount > selectedSupplier.debtBalance}
                        >
                          {isPayLoading && <Loader2 className="mr-1 size-4 animate-spin" />}
                          {ts.modalRecordPayment}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setIsPayOpen(false); setPayAmount(0) }}>
                          <X className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant={selectedSupplier.debtBalance > 1000 ? 'destructive' : 'outline'}
                        onClick={() => { setIsPayOpen(true); setPayAmount(selectedSupplier.debtBalance) }}
                      >
                        {ts.modalRecordPayment}
                      </Button>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {ts.modalContactInfo}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="size-4 text-muted-foreground" />
                      <span>{selectedSupplier.email || '—'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="size-4 text-muted-foreground" />
                      <span>{selectedSupplier.phone || '—'}</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="mt-0.5 size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{selectedSupplier.address || '—'}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 text-sm sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{ts.modalCreatedAt}</p>
                    <p className="font-medium">{new Date(selectedSupplier.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{ts.modalUpdatedAt}</p>
                    <p className="font-medium">{new Date(selectedSupplier.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {ts.modalRecentOrders}
                  </h4>
                  {isPOsLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex gap-3 border-t py-2">
                          <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />
                          <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
                          <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
                          <div className="ml-auto h-3.5 w-20 animate-pulse rounded bg-muted" />
                        </div>
                      ))}
                    </div>
                  ) : supplierPOs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{ts.noPOHistory}</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs uppercase text-muted-foreground">
                          <th className="py-1 text-left font-medium">{ts.modalColPO}</th>
                          <th className="py-1 text-left font-medium">{ts.modalColDate}</th>
                          <th className="py-1 text-left font-medium">{ts.modalColStatus}</th>
                          <th className="py-1 text-right font-medium">{ts.modalColTotal}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supplierPOs.map(po => (
                          <tr key={po.id} className="border-t">
                            <td className="py-1.5 font-mono text-xs">{po.orderCode}</td>
                            <td className="py-1.5">{new Date(po.createdAt).toLocaleDateString()}</td>
                            <td className="py-1.5">{po.status}</td>
                            <td className="py-1.5 text-right font-medium">{formatCurrency(po.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
                <Button variant="outline" onClick={() => setSelectedSupplier(null)}>
                  {ts.modalClose}
                </Button>
                <Button onClick={() => handleOpenEdit(selectedSupplier)}>
                  {ts.modalEdit}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create / Edit Modal */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) setIsFormOpen(false) }}>
        <DialogContent className="max-w-md p-0" aria-describedby={undefined}>
          <form onSubmit={handleFormSubmit}>
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle>
                {editingSupplier ? ts.editSupplierTitle : ts.addSupplierTitle}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-6">
              <div className="space-y-1.5">
                <Label htmlFor="s-name">{ts.nameLabel} *</Label>
                <Input
                  id="s-name"
                  value={formData.name}
                  onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-code">{ts.codeLabel}</Label>
                <Input
                  id="s-code"
                  value={formData.code}
                  onChange={(e) => setFormData((d) => ({ ...d, code: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-phone">{ts.phoneLabel}</Label>
                <Input
                  id="s-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((d) => ({ ...d, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-email">{ts.emailLabel}</Label>
                <Input
                  id="s-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-address">{ts.addressLabel}</Label>
                <Textarea
                  id="s-address"
                  value={formData.address}
                  onChange={(e) => setFormData((d) => ({ ...d, address: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={isFormLoading || !formData.name.trim()}>
                {isFormLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {t.common.save}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
