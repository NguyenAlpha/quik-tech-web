"use client"

import { useState, useMemo, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { formatCurrency } from "@/lib/utils"
import { getPayments } from "@/lib/api"
import { PaymentsTable } from "@/components/payments-table"
import {
  Search,
  Plus,
  X,
  Wallet,
  CreditCard,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { TableFooter } from "@/components/table-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import type { Payment } from "@/lib/types"

export default function PaymentsPage() {
  const { t } = useLanguage()
  const tp = t.payments
  const [payments, setPayments] = useState<Payment[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [methodFilter, setMethodFilter] = useState<string>("all")
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  useEffect(() => {
    getPayments().then(setPayments)
  }, [])

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch =
        (payment.note ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (payment.paymentMethod ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (payment.customerPublicId ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (payment.supplierPublicId ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      const matchesMethod =
        methodFilter === "all" || payment.paymentMethod === methodFilter
      return matchesSearch && matchesMethod
    })
  }, [searchQuery, methodFilter, payments])

  const totalAmount = useMemo(() => {
    return payments.reduce((sum, p) => sum + p.amount, 0)
  }, [payments])

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 lg:p-10">
      {/* Page Header */}
      <PageHeader title={tp.title} subtitle={tp.subtitle}>
        <Button className="gap-2 shadow-sm">
          <Plus className="size-4" />
          {tp.addPayment}
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
              <CreditCard className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">
                {tp.totalPayments ?? "Total Payments"}
              </p>
              <p className="text-2xl font-semibold tracking-tight">
                {payments.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
              <Wallet className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">
                {tp.totalAmount ?? "Total Amount"}
              </p>
              <p className="text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalAmount)}
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
            placeholder={tp.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[180px]">
            <SelectValue placeholder={tp.allMethods ?? "All Methods"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tp.allMethods ?? "All Methods"}</SelectItem>
            <SelectItem value="cash">{tp.methodCash}</SelectItem>
            <SelectItem value="bank_transfer">{tp.methodBankTransfer}</SelectItem>
            <SelectItem value="credit_card">{tp.methodCreditCard}</SelectItem>
            <SelectItem value="check">{tp.methodCheck}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments Table */}
      <PaymentsTable payments={filteredPayments} onSelect={setSelectedPayment} />

      {/* Table Footer */}
      <TableFooter filtered={filteredPayments.length} total={payments.length} label={tp.payments} />

      {/* Payment Detail Modal */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-md p-0">
          {selectedPayment && (
            <>
              <DialogHeader className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
                      <CreditCard className="size-5 text-blue-600 dark:text-blue-400" />
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
                  <p className="text-3xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(selectedPayment.amount)}
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
                      <span className="text-sm text-muted-foreground">{tp.modalCustomer ?? "Customer"}</span>
                      <span className="font-mono text-sm">{selectedPayment.customerPublicId}</span>
                    </div>
                  )}
                  {selectedPayment.supplierPublicId && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{tp.modalSupplier ?? "Supplier"}</span>
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
