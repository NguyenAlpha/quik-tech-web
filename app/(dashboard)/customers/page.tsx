"use client"

import { useState, useMemo, useEffect } from "react"
import { toast } from 'sonner'
import { useLanguage } from "@/lib/language-context"
import { formatCurrency } from "@/lib/utils"
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, payCustomer, getOrdersPage, ApiError } from "@/lib/api"
import { PageSkeleton } from "@/components/page-skeleton"
import { PageError } from "@/components/page-error"
import { CustomersTable } from "@/components/customers-table"
import {
  Search,
  Users,
  Plus,
  X,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { TableFooter } from "@/components/table-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import type { Customer, Order } from "@/lib/types"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const emptyForm = { name: "", code: "", phone: "", email: "", address: "" }

export default function CustomersPage() {
  const { t } = useLanguage()
  const tc = t.customers

  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [debtFilter, setDebtFilter] = useState<string>("all")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [isFormLoading, setIsFormLoading] = useState(false)

  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isPayOpen, setIsPayOpen] = useState(false)
  const [payAmount, setPayAmount] = useState(0)
  const [isPayLoading, setIsPayLoading] = useState(false)

  const [customerOrders, setCustomerOrders] = useState<Order[]>([])
  const [isOrdersLoading, setIsOrdersLoading] = useState(false)

  const init = async () => {
    setIsPageLoading(true)
    setPageError(null)
    try {
      setCustomers(await getCustomers())
    } catch (err) {
      setPageError(err instanceof ApiError ? err.message : 'Failed to load data')
    } finally {
      setIsPageLoading(false)
    }
  }

  useEffect(() => {
    if (refreshKey === 0) { init(); return }
    getCustomers().then(setCustomers).catch(() => {})
  }, [refreshKey])

  useEffect(() => {
    if (!selectedCustomer) { setCustomerOrders([]); return }
    setIsOrdersLoading(true)
    getOrdersPage({ page: 0, size: 5, customerPublicId: selectedCustomer.id })
      .then(r => setCustomerOrders(r.content))
      .catch(() => setCustomerOrders([]))
      .finally(() => setIsOrdersLoading(false))
  }, [selectedCustomer?.id])

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        customer.code.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDebt =
        debtFilter === "all" ||
        (debtFilter === "with_debt" && customer.debtBalance > 0) ||
        (debtFilter === "no_debt" && customer.debtBalance === 0)
      return matchesSearch && matchesDebt
    })
  }, [searchQuery, debtFilter, customers])

  const totalDebt = useMemo(() => customers.reduce((sum, c) => sum + c.debtBalance, 0), [customers])
  const customersWithDebt = useMemo(() => customers.filter((c) => c.debtBalance > 0).length, [customers])

  const handleOpenCreate = () => {
    setEditingCustomer(null)
    setFormData(emptyForm)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      code: customer.code,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
    })
    setSelectedCustomer(null)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsFormLoading(true)
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData)
        toast.success(tc.customerUpdated)
      } else {
        await createCustomer(formData)
        toast.success(tc.customerCreated)
      }
      setIsFormOpen(false)
      setRefreshKey(k => k + 1)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : editingCustomer ? tc.errorUpdatingCustomer : tc.errorCreatingCustomer)
    } finally {
      setIsFormLoading(false)
    }
  }

  const handlePayCustomer = async () => {
    if (!selectedCustomer || payAmount <= 0) return
    setIsPayLoading(true)
    try {
      const updated = await payCustomer(selectedCustomer.id, payAmount)
      toast.success(tc.customerPaid)
      setIsPayOpen(false)
      setPayAmount(0)
      setSelectedCustomer(updated)
      setRefreshKey(k => k + 1)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : tc.errorPayingCustomer)
    } finally {
      setIsPayLoading(false)
    }
  }

  const handleDelete = async (customer: Customer) => {
    setIsDeleting(customer.id)
    try {
      await deleteCustomer(customer.id)
      toast.success(tc.customerDeleted)
      setRefreshKey(k => k + 1)
    } catch (error) {
      // 400 VALIDATION_ERROR: backend chặn xóa khách hàng còn công nợ
      if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
        toast.error(tc.deleteBlockedHasDebt)
      } else {
        toast.error(error instanceof ApiError ? error.message : tc.errorDeletingCustomer)
      }
    } finally {
      setIsDeleting(null)
    }
  }

  if (isPageLoading) return <PageSkeleton />
  if (pageError) return <PageError message={pageError} onRetry={init} />

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-10">
      <PageHeader title={tc.title} subtitle={tc.subtitle}>
        <Button onClick={handleOpenCreate} className="gap-2 shadow-sm">
          <Plus className="size-4" />
          {tc.addCustomer}
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
              <Users className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">{tc.totalCustomers}</p>
              <p className="text-2xl font-semibold tracking-tight">{customers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950">
              <AlertCircle className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">{tc.customersWithDebt}</p>
              <p className="text-2xl font-semibold tracking-tight">{customersWithDebt}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
              <span className="text-lg font-semibold text-red-600 dark:text-red-400">$</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">{tc.totalOutstanding}</p>
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
            placeholder={tc.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <Select value={debtFilter} onValueChange={setDebtFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[160px]">
            <SelectValue placeholder={tc.allBalances} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tc.allBalances}</SelectItem>
            <SelectItem value="with_debt">{tc.withDebt}</SelectItem>
            <SelectItem value="no_debt">{tc.noDebt}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CustomersTable
        customers={filteredCustomers}
        onSelect={setSelectedCustomer}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <TableFooter filtered={filteredCustomers.length} total={customers.length} label={tc.customers} />

      {/* Customer Detail Modal */}
      <Dialog open={!!selectedCustomer} onOpenChange={open => { if (!open) { setSelectedCustomer(null); setIsPayOpen(false); setPayAmount(0) } }}>
        <DialogContent className="w-full max-w-lg sm:max-w-2xl p-0" showCloseButton={false}>
          {selectedCustomer && (
            <>
              <DialogHeader className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-12 border-2">
                      <AvatarFallback className="bg-muted text-base font-medium">
                        {getInitials(selectedCustomer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-lg">{selectedCustomer.name}</DialogTitle>
                      <p className="font-mono text-sm text-muted-foreground">{selectedCustomer.code}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    <X className="size-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-6 p-6">
                {selectedCustomer.debtBalance > 0 && (
                  <div
                    className={`flex items-center gap-3 rounded-lg border p-4 ${
                      selectedCustomer.debtBalance > 1000
                        ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50"
                        : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50"
                    }`}
                  >
                    <AlertCircle
                      className={`size-5 ${
                        selectedCustomer.debtBalance > 1000
                          ? "text-red-600 dark:text-red-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${selectedCustomer.debtBalance > 1000 ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300"}`}>
                        {tc.modalOutstandingBalance}
                      </p>
                      <p className={`text-2xl font-bold ${selectedCustomer.debtBalance > 1000 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                        {formatCurrency(selectedCustomer.debtBalance)}
                      </p>
                    </div>
                    {isPayOpen ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0.01}
                          max={selectedCustomer.debtBalance}
                          step={0.01}
                          value={payAmount}
                          onChange={e => setPayAmount(Number(e.target.value))}
                          className="h-9 w-32 text-sm"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={handlePayCustomer}
                          disabled={isPayLoading || payAmount <= 0 || payAmount > selectedCustomer.debtBalance}
                        >
                          {isPayLoading && <Loader2 className="mr-1 size-4 animate-spin" />}
                          {tc.modalRecordPayment}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setIsPayOpen(false); setPayAmount(0) }}>
                          <X className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant={selectedCustomer.debtBalance > 1000 ? "destructive" : "outline"}
                        onClick={() => { setIsPayOpen(true); setPayAmount(selectedCustomer.debtBalance) }}
                      >
                        {tc.modalRecordPayment}
                      </Button>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {tc.modalContactInfo}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="size-4 text-muted-foreground" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="size-4 text-muted-foreground" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="mt-0.5 size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{selectedCustomer.address}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 text-sm sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{tc.modalCreatedAt}</p>
                    <p className="font-medium">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{tc.modalUpdatedAt}</p>
                    <p className="font-medium">{new Date(selectedCustomer.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {tc.modalRecentOrders}
                  </h4>
                  {isOrdersLoading ? (
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
                  ) : customerOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{tc.noOrderHistory}</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs uppercase text-muted-foreground">
                          <th className="py-1 text-left font-medium">{tc.modalColOrder}</th>
                          <th className="py-1 text-left font-medium">{tc.modalColDate}</th>
                          <th className="py-1 text-left font-medium">{tc.modalColStatus}</th>
                          <th className="py-1 text-right font-medium">{tc.modalColTotal}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerOrders.map(order => (
                          <tr key={order.id} className="border-t">
                            <td className="py-1.5 font-mono text-xs">{order.orderCode}</td>
                            <td className="py-1.5">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="py-1.5">{order.status}</td>
                            <td className="py-1.5 text-right font-medium">{formatCurrency(order.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
                <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
                  {tc.modalClose}
                </Button>
                <Button onClick={() => handleOpenEdit(selectedCustomer)}>
                  {tc.modalEdit}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create / Edit Modal */}
      <Dialog open={isFormOpen} onOpenChange={open => { if (!open) setIsFormOpen(false) }}>
        <DialogContent className="max-w-md p-0">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle>
                {editingCustomer ? tc.editCustomerTitle : tc.addCustomerTitle}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-6">
              <div className="space-y-1.5">
                <Label htmlFor="c-name">{tc.nameLabel} *</Label>
                <Input
                  id="c-name"
                  value={formData.name}
                  onChange={e => setFormData(d => ({ ...d, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-code">{tc.codeLabel}</Label>
                <Input
                  id="c-code"
                  value={formData.code}
                  onChange={e => setFormData(d => ({ ...d, code: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-phone">{tc.phoneLabel}</Label>
                <Input
                  id="c-phone"
                  value={formData.phone}
                  onChange={e => setFormData(d => ({ ...d, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-email">{tc.emailLabel}</Label>
                <Input
                  id="c-email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(d => ({ ...d, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-address">{tc.addressLabel}</Label>
                <Textarea
                  id="c-address"
                  value={formData.address}
                  onChange={e => setFormData(d => ({ ...d, address: e.target.value }))}
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
