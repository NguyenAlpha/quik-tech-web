"use client"

import { useState, useMemo, useEffect } from "react"
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
  Calendar,
  ShoppingBag,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import type { Customer, CustomerOrder } from "@/lib/types"

const orderStatusStyles: Record<string, string> = {
  completed:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  pending:
    "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  cancelled:
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}


export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
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
        customer.phone.includes(searchQuery)
      const matchesStatus =
        statusFilter === "all" || customer.status === statusFilter
      const matchesDebt =
        debtFilter === "all" ||
        (debtFilter === "with_debt" && customer.debtBalance > 0) ||
        (debtFilter === "no_debt" && customer.debtBalance === 0)
      return matchesSearch && matchesStatus && matchesDebt
    })
  }, [searchQuery, statusFilter, debtFilter])

  const totalDebt = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.debtBalance, 0)
  }, [])

  const customersWithDebt = useMemo(() => {
    return customers.filter((c) => c.debtBalance > 0).length
  }, [])

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 lg:p-10">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Customers
          </h1>
          <p className="text-base text-muted-foreground">
            Manage your customer relationships and track balances
          </p>
        </div>
        <Button className="gap-2 shadow-sm">
          <Plus className="size-4" />
          Add Customer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
              <Users className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">
                Total Customers
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
                Customers with Debt
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
                Total Outstanding
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
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={debtFilter} onValueChange={setDebtFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[160px]">
            <SelectValue placeholder="Debt" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Balances</SelectItem>
            <SelectItem value="with_debt">With Debt</SelectItem>
            <SelectItem value="no_debt">No Debt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customers Table */}
      <CustomersTable customers={filteredCustomers} onSelect={setSelectedCustomer} />

      {/* Table Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Showing{" "}
          <span className="font-medium text-foreground">
            {filteredCustomers.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">{customers.length}</span>{" "}
          customers
        </p>
      </div>

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
                      <p className="text-sm text-muted-foreground">
                        Customer since {selectedCustomer.joinedDate}
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
                        Outstanding Balance
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
                      Record Payment
                    </Button>
                  </div>
                )}

                {/* Contact & Stats */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Contact Information
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

                  <div className="space-y-4">
                    <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Customer Stats
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ShoppingBag className="size-4" />
                          Total Orders
                        </div>
                        <p className="text-xl font-semibold">
                          {selectedCustomer.orderCount}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="text-sm">$</span>
                          Total Spent
                        </div>
                        <p className="text-xl font-semibold">
                          {formatCurrency(selectedCustomer.totalSpent)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="size-4" />
                          Last Order
                        </div>
                        <p className="text-sm font-medium">
                          {selectedCustomer.lastOrderDate}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          Status
                        </div>
                        <Badge
                          variant="secondary"
                          className={statusStyles[selectedCustomer.status].className}
                        >
                          {statusStyles[selectedCustomer.status].label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Recent Orders */}
                <div className="space-y-4">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Recent Orders
                  </h4>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="pl-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Order
                          </TableHead>
                          <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Date
                          </TableHead>
                          <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Status
                          </TableHead>
                          <TableHead className="pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Total
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCustomer.recentOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="pl-4">
                              <span className="font-mono text-sm font-medium">
                                {order.id}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {order.date}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={orderStatusStyles[order.status]}
                              >
                                {order.status.charAt(0).toUpperCase() +
                                  order.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="pr-4 text-right">
                              <span className="font-mono text-sm font-medium">
                                {formatCurrency(order.total)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
                <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
                  Close
                </Button>
                <Button>Edit Customer</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
