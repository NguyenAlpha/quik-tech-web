"use client"

import { useState, useMemo, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { formatCurrency } from "@/lib/utils"
import { getCustomers } from "@/lib/api"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import type { Customer } from "@/lib/types"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function CustomersPage() {
  const { t } = useLanguage()
  const tc = t.customers
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [debtFilter, setDebtFilter] = useState<string>("all")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    getCustomers().then(setCustomers)
  }, [])

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

  const totalDebt = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.debtBalance, 0)
  }, [customers])

  const customersWithDebt = useMemo(() => {
    return customers.filter((c) => c.debtBalance > 0).length
  }, [customers])

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 lg:p-10">
      {/* Page Header */}
      <PageHeader title={tc.title} subtitle={tc.subtitle}>
        <Button className="gap-2 shadow-sm">
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
              <p className="text-sm font-medium text-muted-foreground">
                {tc.totalCustomers}
              </p>
              <p className="text-2xl font-semibold tracking-tight">
                {customers.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950">
              <AlertCircle className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">
                {tc.customersWithDebt}
              </p>
              <p className="text-2xl font-semibold tracking-tight">
                {customersWithDebt}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
              <span className="text-lg font-semibold text-red-600 dark:text-red-400">$</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">
                {tc.totalOutstanding}
              </p>
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

      {/* Customers Table */}
      <CustomersTable customers={filteredCustomers} onSelect={setSelectedCustomer} />

      {/* Table Footer */}
      <TableFooter filtered={filteredCustomers.length} total={customers.length} label={tc.customers} />

      {/* Customer Detail Modal */}
      <Dialog
        open={!!selectedCustomer}
        onOpenChange={() => setSelectedCustomer(null)}
      >
        <DialogContent className="max-w-2xl p-0">
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
                      <DialogTitle className="text-lg">
                        {selectedCustomer.name}
                      </DialogTitle>
                      <p className="text-sm text-muted-foreground font-mono">
                        {selectedCustomer.code}
                      </p>
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
                {/* Debt Alert */}
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
                      <p
                        className={`text-sm font-medium ${
                          selectedCustomer.debtBalance > 1000
                            ? "text-red-800 dark:text-red-300"
                            : "text-amber-800 dark:text-amber-300"
                        }`}
                      >
                        {tc.modalOutstandingBalance}
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          selectedCustomer.debtBalance > 1000
                            ? "text-red-600 dark:text-red-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {formatCurrency(selectedCustomer.debtBalance)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={
                        selectedCustomer.debtBalance > 1000
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {tc.modalRecordPayment}
                    </Button>
                  </div>
                )}

                {/* Contact Info */}
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
                      <MapPin className="size-4 mt-0.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {selectedCustomer.address}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Metadata */}
                <div className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">
                      {tc.modalCreatedAt ?? "Created"}
                    </p>
                    <p className="font-medium">
                      {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">
                      {tc.modalUpdatedAt ?? "Last Updated"}
                    </p>
                    <p className="font-medium">
                      {new Date(selectedCustomer.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
                <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
                  {tc.modalClose}
                </Button>
                <Button>{tc.modalEdit}</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
