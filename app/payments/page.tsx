"use client"

import { useState, useMemo, useEffect } from "react"
import { formatCurrency } from "@/lib/utils"
import { getPayments } from "@/lib/api"
import { PaymentsTable } from "@/components/payments-table"
import {
  Search,
  Plus,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react"
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
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import type { Payment } from "@/lib/types"


export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  useEffect(() => {
    getPayments().then(setPayments)
  }, [])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newPayment, setNewPayment] = useState({
    type: "income" as "income" | "expense",
    amount: "",
    category: "",
    description: "",
    contactName: "",
    contactType: "customer" as "customer" | "supplier",
    method: "bank_transfer" as Payment["method"],
    reference: "",
  })

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch =
        payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.reference.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType =
        typeFilter === "all" || payment.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [searchQuery, typeFilter])

  const totalIncome = useMemo(() => {
    return payments
      .filter((p) => p.type === "income")
      .reduce((sum, p) => sum + p.amount, 0)
  }, [])

  const totalExpenses = useMemo(() => {
    return payments
      .filter((p) => p.type === "expense")
      .reduce((sum, p) => sum + p.amount, 0)
  }, [])

  const netBalance = totalIncome - totalExpenses

  const handleAddPayment = () => {
    setIsAddModalOpen(false)
    setNewPayment({
      type: "income",
      amount: "",
      category: "",
      description: "",
      contactName: "",
      contactType: "customer",
      method: "bank_transfer",
      reference: "",
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 lg:p-10">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Payments
          </h1>
          <p className="text-base text-muted-foreground">
            Track income, expenses, and financial transactions
          </p>
        </div>
        <Button className="gap-2 shadow-sm" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="size-4" />
          Add Payment
        </Button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
              <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">
                Total Income
              </p>
              <p className="text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalIncome)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
              <TrendingDown className="size-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">
                Total Expenses
              </p>
              <p className="text-2xl font-semibold tracking-tight text-red-600 dark:text-red-400">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className={`flex size-12 items-center justify-center rounded-full ${
              netBalance >= 0 
                ? "bg-blue-50 dark:bg-blue-950" 
                : "bg-amber-50 dark:bg-amber-950"
            }`}>
              <Wallet className={`size-5 ${
                netBalance >= 0 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-amber-600 dark:text-amber-400"
              }`} />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">
                Net Balance
              </p>
              <p className={`text-2xl font-semibold tracking-tight ${
                netBalance >= 0 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-amber-600 dark:text-amber-400"
              }`}>
                {formatCurrency(netBalance)}
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
            placeholder="Search payments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments Table */}
      <PaymentsTable payments={filteredPayments} onSelect={setSelectedPayment} />

      {/* Table Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Showing{" "}
          <span className="font-medium text-foreground">
            {filteredPayments.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">{payments.length}</span>{" "}
          payments
        </p>
      </div>

      {/* Payment Detail Modal */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-md p-0">
          {selectedPayment && (
            <>
              <DialogHeader className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-10 items-center justify-center rounded-full ${
                      selectedPayment.type === "income"
                        ? "bg-emerald-50 dark:bg-emerald-950"
                        : "bg-red-50 dark:bg-red-950"
                    }`}>
                      {selectedPayment.type === "income" ? (
                        <ArrowDownLeft className="size-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowUpRight className="size-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div>
                      <DialogTitle className="font-mono text-base">
                        {selectedPayment.id}
                      </DialogTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedPayment.date}
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
                  <p className="text-sm text-muted-foreground mb-1">Amount</p>
                  <p className={`text-3xl font-semibold tracking-tight ${
                    selectedPayment.type === "income"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}>
                    {selectedPayment.type === "income" ? "+" : "-"}
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                  <Badge
                    variant="secondary"
                    className={`mt-2 ${typeStyles[selectedPayment.type].className}`}
                  >
                    {typeStyles[selectedPayment.type].label}
                  </Badge>
                </div>

                <Separator />

                {/* Details */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Contact</span>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-6 border">
                        <AvatarFallback className="bg-muted text-[10px] font-medium">
                          {getInitials(selectedPayment.contactName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{selectedPayment.contactName}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <span className="text-sm capitalize">{selectedPayment.contactType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Category</span>
                    <span className="text-sm">{selectedPayment.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Method</span>
                    <span className="text-sm">{methodLabels[selectedPayment.method]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reference</span>
                    <span className="font-mono text-sm">{selectedPayment.reference}</span>
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm">{selectedPayment.description}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Payment Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Payment Type */}
            <div className="space-y-2">
              <Label>Payment Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewPayment({ ...newPayment, type: "income", contactType: "customer" })}
                  className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                    newPayment.type === "income"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <ArrowDownLeft className="size-4" />
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setNewPayment({ ...newPayment, type: "expense", contactType: "supplier" })}
                  className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                    newPayment.type === "expense"
                      ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <ArrowUpRight className="size-4" />
                  Expense
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  className="pl-7"
                />
              </div>
            </div>

            {/* Contact Name */}
            <div className="space-y-2">
              <Label htmlFor="contactName">
                {newPayment.type === "income" ? "Customer" : "Supplier"} Name
              </Label>
              <Input
                id="contactName"
                placeholder={`Enter ${newPayment.type === "income" ? "customer" : "supplier"} name`}
                value={newPayment.contactName}
                onChange={(e) => setNewPayment({ ...newPayment, contactName: e.target.value })}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newPayment.category}
                onValueChange={(value) => setNewPayment({ ...newPayment, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {newPayment.type === "income" ? (
                    <>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Services">Services</SelectItem>
                      <SelectItem value="Refund">Refund</SelectItem>
                      <SelectItem value="Other Income">Other Income</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Inventory">Inventory</SelectItem>
                      <SelectItem value="Utilities">Utilities</SelectItem>
                      <SelectItem value="Rent">Rent</SelectItem>
                      <SelectItem value="Shipping">Shipping</SelectItem>
                      <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                      <SelectItem value="Other Expense">Other Expense</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select
                value={newPayment.method}
                onValueChange={(value: Payment["method"]) => setNewPayment({ ...newPayment, method: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reference */}
            <div className="space-y-2">
              <Label htmlFor="reference">Reference (Optional)</Label>
              <Input
                id="reference"
                placeholder="e.g., Invoice number, Order ID"
                value={newPayment.reference}
                onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add a description..."
                value={newPayment.description}
                onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPayment}>
              Add Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
