"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { formatCurrency } from "@/lib/utils"
import { getPaymentsPage, createPayment, deletePayment, getCustomers, getSuppliers, ApiError } from "@/lib/api"
import { PaymentsTable } from "@/components/payments-table"
import {
  Search,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { TableFooter } from "@/components/table-footer"
import { PageSkeleton } from "@/components/page-skeleton"
import { PageError } from "@/components/page-error"
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
import { Separator } from "@/components/ui/separator"
import type { Payment, Customer, Supplier } from "@/lib/types"

const PAGE_SIZE = 20
const isIncome = (p: Payment) => p.supplierPublicId == null

export default function PaymentsPage() {
  const { t } = useLanguage()
  const tp = t.payments

  const [payments, setPayments] = useState<Payment[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)

  const [searchQuery, setSearchQuery] = useState("")
  const [methodFilter, setMethodFilter] = useState<string>("all")
  const [directionFilter, setDirectionFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [isPageLoading, setIsPageLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)

  // Create modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createDirection, setCreateDirection] = useState<"income" | "expense">("income")
  const [createCustomerId, setCreateCustomerId] = useState("")
  const [createSupplierId, setCreateSupplierId] = useState("")
  const [createAmount, setCreateAmount] = useState("")
  const [createMethod, setCreateMethod] = useState("CASH")
  const [createNote, setCreateNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [allCustomers, setAllCustomers] = useState<Customer[]>([])
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([])

  const isFirstRender = useRef(true)

  const applyPreset = (months: number) => {
    const now = new Date()
    const from = new Date(now)
    from.setMonth(from.getMonth() - months)
    setDateFrom(from.toISOString().split("T")[0])
    setDateTo(now.toISOString().split("T")[0])
    setCurrentPage(0)
  }

  // Initial load
  const init = async () => {
    setIsPageLoading(true)
    setPageError(null)
    try {
      const result = await getPaymentsPage({ page: 0, size: PAGE_SIZE })
      setPayments(result.content)
      setTotalElements(result.totalElements)
      setTotalPages(result.totalPages)
      setTotalIncome(result.totalIncome)
      setTotalExpense(result.totalExpense)
    } catch (err) {
      setPageError(err instanceof ApiError ? err.message : 'Failed to load data')
    } finally {
      setIsPageLoading(false)
    }
  }

  useEffect(() => { init() }, [])

  // Subsequent fetches
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    getPaymentsPage({
      page: currentPage,
      size: PAGE_SIZE,
      direction: directionFilter !== "all" ? directionFilter : undefined,
      method: methodFilter !== "all" ? methodFilter : undefined,
      from: dateFrom || undefined,
      to: dateTo || undefined,
    }).then(result => {
      setPayments(result.content)
      setTotalElements(result.totalElements)
      setTotalPages(result.totalPages)
      setTotalIncome(result.totalIncome)
      setTotalExpense(result.totalExpense)
    })
  }, [currentPage, directionFilter, methodFilter, dateFrom, dateTo, refreshKey])

  const handleOpenCreate = () => {
    setCreateDirection("income")
    setCreateCustomerId("")
    setCreateSupplierId("")
    setCreateAmount("")
    setCreateMethod("CASH")
    setCreateNote("")
    setIsCreateOpen(true)
    if (allCustomers.length === 0) getCustomers().then(setAllCustomers).catch(() => {})
    if (allSuppliers.length === 0) getSuppliers().then(setAllSuppliers).catch(() => {})
  }

  const handleDelete = async (payment: Payment) => {
    if (!window.confirm(tp.deleteConfirm)) return
    try {
      await deletePayment(payment.id)
      toast.success(tp.deleteSuccess)
      setCurrentPage(0)
      setRefreshKey(k => k + 1)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : tp.deleteError)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createAmount || Number(createAmount) <= 0) return
    setIsSubmitting(true)
    try {
      await createPayment({
        paidAmount: Number(createAmount),
        paymentMethod: createMethod,
        customerPublicId: createDirection === "income" && createCustomerId ? createCustomerId : undefined,
        supplierPublicId: createDirection === "expense" && createSupplierId ? createSupplierId : undefined,
        note: createNote || undefined,
      })
      toast.success(tp.createSuccess)
      setIsCreateOpen(false)
      setCurrentPage(0)
      setRefreshKey(k => k + 1)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : tp.createError)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Client-side text filter on current page
  const filteredPayments = useMemo(() => {
    if (!searchQuery) return payments
    const q = searchQuery.toLowerCase()
    return payments.filter(p =>
      (p.note ?? "").toLowerCase().includes(q) ||
      (p.paymentMethod ?? "").toLowerCase().includes(q) ||
      (p.customerPublicId ?? "").toLowerCase().includes(q) ||
      (p.supplierPublicId ?? "").toLowerCase().includes(q)
    )
  }, [searchQuery, payments])

  if (isPageLoading) return <PageSkeleton />
  if (pageError) return <PageError message={pageError} onRetry={init} />

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-10">
      {/* Page Header */}
      <PageHeader title={tp.title} subtitle={tp.subtitle}>
        <Button className="gap-2 shadow-sm" onClick={handleOpenCreate}>
          <Plus className="size-4" />
          {tp.addPayment}
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
              <CreditCard className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">{tp.totalPayments}</p>
              <p className="text-2xl font-semibold tracking-tight">{totalElements}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
              <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">{tp.totalIncome}</p>
              <p className="text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalIncome)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950">
              <TrendingDown className="size-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">{tp.totalExpenses}</p>
              <p className="text-2xl font-semibold tracking-tight text-rose-600 dark:text-rose-400">
                {formatCurrency(totalExpense)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={tp.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9"
            />
          </div>
          <Select value={directionFilter} onValueChange={v => { setDirectionFilter(v); setCurrentPage(0) }}>
            <SelectTrigger className="h-10 w-full sm:w-[160px]">
              <SelectValue placeholder={tp.allTypes} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tp.allTypes}</SelectItem>
              <SelectItem value="income">{tp.income}</SelectItem>
              <SelectItem value="expense">{tp.expense}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={v => { setMethodFilter(v); setCurrentPage(0) }}>
            <SelectTrigger className="h-10 w-full sm:w-[180px]">
              <SelectValue placeholder={tp.allMethods} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tp.allMethods}</SelectItem>
              <SelectItem value="CASH">{tp.methodCash}</SelectItem>
              <SelectItem value="TRANSFER">{tp.methodBankTransfer}</SelectItem>
            </SelectContent>
          </Select>
          {(searchQuery || directionFilter !== "all" || methodFilter !== "all" || dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              className="w-fit gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => { setSearchQuery(""); setDirectionFilter("all"); setMethodFilter("all"); setDateFrom(""); setDateTo(""); setCurrentPage(0) }}
            >
              <X className="size-3.5" />
              Reset filter
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Từ</span>
            <Input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setCurrentPage(0) }}
              className="h-9 w-32 sm:w-36"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Đến</span>
            <Input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setCurrentPage(0) }}
              className="h-9 w-32 sm:w-36"
            />
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => applyPreset(3)}>3 tháng</Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset(6)}>6 tháng</Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset(12)}>1 năm</Button>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <PaymentsTable payments={filteredPayments} onSelect={setSelectedPayment} onDelete={handleDelete} />

      {/* Table Footer */}
      <TableFooter filtered={filteredPayments.length} total={totalElements} label={tp.payments}>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </TableFooter>

      {/* Create Payment Modal */}
      <Dialog open={isCreateOpen} onOpenChange={open => { if (!open) setIsCreateOpen(false) }}>
        <DialogContent className="max-w-md p-0">
          <form onSubmit={handleCreate}>
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle>{tp.addModalTitle}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-6">
              <div className="space-y-1.5">
                <Label>{tp.addModalPaymentType}</Label>
                <Select value={createDirection} onValueChange={v => { setCreateDirection(v as "income" | "expense"); setCreateCustomerId(""); setCreateSupplierId("") }}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">{tp.income}</SelectItem>
                    <SelectItem value="expense">{tp.expense}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {createDirection === "income" && (
                <div className="space-y-1.5">
                  <Label>{tp.selectCustomer}</Label>
                  <Select value={createCustomerId} onValueChange={setCreateCustomerId}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={tp.selectCustomer} />
                    </SelectTrigger>
                    <SelectContent>
                      {allCustomers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {createDirection === "expense" && (
                <div className="space-y-1.5">
                  <Label>{tp.selectSupplier}</Label>
                  <Select value={createSupplierId} onValueChange={setCreateSupplierId}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={tp.selectSupplier} />
                    </SelectTrigger>
                    <SelectContent>
                      {allSuppliers.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="pay-amount">{tp.addModalAmount} *</Label>
                <Input
                  id="pay-amount"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={createAmount}
                  onChange={e => setCreateAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>{tp.addModalMethod}</Label>
                <Select value={createMethod} onValueChange={setCreateMethod}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">{tp.methodCash}</SelectItem>
                    <SelectItem value="TRANSFER">{tp.methodBankTransfer}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pay-note">{tp.addModalDescription}</Label>
                <Textarea
                  id="pay-note"
                  value={createNote}
                  onChange={e => setCreateNote(e.target.value)}
                  rows={2}
                  placeholder={tp.addModalDescPlaceholder}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !createAmount || Number(createAmount) <= 0}>
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {tp.addModalTitle}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Detail Modal */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-md p-0">
          {selectedPayment && (
            <>
              <DialogHeader className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-10 items-center justify-center rounded-full ${isIncome(selectedPayment) ? "bg-emerald-50 dark:bg-emerald-950" : "bg-rose-50 dark:bg-rose-950"}`}>
                      {isIncome(selectedPayment)
                        ? <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400" />
                        : <TrendingDown className="size-5 text-rose-600 dark:text-rose-400" />
                      }
                    </div>
                    <div>
                      <DialogTitle className="font-mono text-base">
                        {selectedPayment.id}
                      </DialogTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedPayment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setSelectedPayment(null)}
                  >
                    <X className="size-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-6 p-6">
                {/* Amount */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">{tp.modalAmount}</p>
                  <p className={`text-3xl font-semibold tracking-tight ${isIncome(selectedPayment) ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {isIncome(selectedPayment) ? "+" : "-"}{formatCurrency(selectedPayment.amount)}
                  </p>
                  <p className={`text-sm mt-1 font-medium ${isIncome(selectedPayment) ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {isIncome(selectedPayment) ? tp.income : tp.expense}
                  </p>
                </div>

                <Separator />

                {/* Details */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{tp.modalMethod}</span>
                    <span className="text-sm capitalize">
                      {selectedPayment.paymentMethod?.replace("_", " ") ?? "—"}
                    </span>
                  </div>
                  {selectedPayment.customerPublicId && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{tp.modalCustomer}</span>
                      <span className="font-mono text-sm">{selectedPayment.customerPublicId}</span>
                    </div>
                  )}
                  {selectedPayment.supplierPublicId && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{tp.modalSupplier}</span>
                      <span className="font-mono text-sm">{selectedPayment.supplierPublicId}</span>
                    </div>
                  )}
                  {selectedPayment.note && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{tp.modalDescription}</p>
                        <p className="text-sm">{selectedPayment.note}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
