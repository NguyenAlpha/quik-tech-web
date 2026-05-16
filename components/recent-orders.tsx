import { ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { statusColorMap } from "@/lib/status-colors"
import { RecentOrdersClient } from "@/components/recent-orders-client"
import type { Order } from "@/components/recent-orders-client"

const recentOrders = [
  {
    id: "ORD-7892",
    customer: "Emily Chen",
    email: "emily.chen@email.com",
    status: "completed",
    total: "$342.00",
    date: "Jan 15, 2024",
  },
  {
    id: "ORD-7891",
    customer: "Michael Brown",
    email: "m.brown@email.com",
    status: "processing",
    total: "$125.00",
    date: "Jan 15, 2024",
  },
  {
    id: "ORD-7890",
    customer: "Sarah Wilson",
    email: "s.wilson@email.com",
    status: "completed",
    total: "$567.00",
    date: "Jan 14, 2024",
  },
  {
    id: "ORD-7889",
    customer: "James Miller",
    email: "j.miller@email.com",
    status: "pending",
    total: "$89.00",
    date: "Jan 14, 2024",
  },
  {
    id: "ORD-7888",
    customer: "Lisa Anderson",
    email: "l.anderson@email.com",
    status: "completed",
    total: "$234.00",
    date: "Jan 13, 2024",
  },
]

export function RecentOrders() {
  const recentOrders: Order[] = [
    {
      id: "ORD-7892",
      customer: "Emily Chen",
      email: "emily.chen@email.com",
      status: "completed",
      total: "$342.00",
      date: "Jan 15, 2024",
    },
    {
      id: "ORD-7891",
      customer: "Michael Brown",
      email: "m.brown@email.com",
      status: "processing",
      total: "$125.00",
      date: "Jan 15, 2024",
    },
    {
      id: "ORD-7890",
      customer: "Sarah Wilson",
      email: "s.wilson@email.com",
      status: "completed",
      total: "$567.00",
      date: "Jan 14, 2024",
    },
    {
      id: "ORD-7889",
      customer: "James Miller",
      email: "j.miller@email.com",
      status: "pending",
      total: "$89.00",
      date: "Jan 14, 2024",
    },
    {
      id: "ORD-7888",
      customer: "Lisa Anderson",
      email: "l.anderson@email.com",
      status: "completed",
      total: "$234.00",
      date: "Jan 13, 2024",
    },
  ]

  return <RecentOrdersClient orders={recentOrders} />
}
