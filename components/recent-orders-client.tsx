'use client'

import { ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { statusColorMap } from "@/lib/status-colors"
import { useLanguage } from "@/lib/language-context"

interface Order {
  id: string
  customer: string
  email: string
  status: "completed" | "processing" | "pending"
  total: string
  date: string
}

interface RecentOrdersClientProps {
  orders: Order[]
}

export type { Order }

const statusStyleMap: Record<string, keyof typeof statusColorMap> = {
  completed: "completed",
  processing: "processing",
  pending: "pending",
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

function getStatusLabel(status: string, t: any): string {
  const statusMap: Record<string, string> = {
    completed: t.recentOrders.completed,
    processing: t.recentOrders.processing,
    pending: t.recentOrders.pending,
  }
  return statusMap[status] || status
}

export function RecentOrdersClient({ orders }: RecentOrdersClientProps) {
  const { t } = useLanguage()

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">{t.recentOrders.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t.recentOrders.subtitle}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1 text-sm text-muted-foreground hover:text-foreground">
            {t.common.viewAll}
            <ArrowUpRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t.recentOrders.order}
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t.recentOrders.customer}
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t.common.date}
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t.common.status}
              </TableHead>
              <TableHead className="pr-6 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t.common.amount}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const statusKey = statusStyleMap[order.status as keyof typeof statusStyleMap] || "neutral"
              const colors = statusColorMap[statusKey]
              return (
                <TableRow key={order.id} className="group cursor-pointer">
                  <TableCell className="pl-6">
                    <span className="font-mono text-sm font-medium">{order.id}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 border">
                        <AvatarFallback className="bg-muted text-xs font-medium">
                          {getInitials(order.customer)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{order.customer}</span>
                        <span className="text-xs text-muted-foreground">{order.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{order.date}</span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={`capitalize ${colors.badge}`}
                    >
                      {getStatusLabel(order.status, t)}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <span className="font-mono text-sm font-semibold">{order.total}</span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
