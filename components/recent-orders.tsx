import { RecentOrdersClient } from "@/components/recent-orders-client"
import { formatCurrency } from "@/lib/utils"
import type { DashboardRecentOrder } from "@/lib/types"

interface RecentOrdersProps {
  orders: DashboardRecentOrder[]
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  const mapped = orders.map(o => ({
    id: o.orderCode,
    customer: o.customerName,
    email: '',
    status: o.status.toLowerCase() as "completed" | "processing" | "pending" | "cancelled",
    total: formatCurrency(o.totalAmount),
    date: new Date(o.createdAt).toLocaleDateString(),
  }))
  return <RecentOrdersClient orders={mapped} />
}
