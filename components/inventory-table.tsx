"use client"

import {
  MoreHorizontal,
  ArrowUpDown,
  Boxes,
  Minus,
  Plus,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowDownCircle,
  History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { InventoryItem } from "@/lib/types"

type StockStatus = "critical" | "low" | "normal" | "high"

function getStockStatus(item: InventoryItem): StockStatus {
  if (item.quantity === 0) return "critical"
  if (item.quantity < item.minStock) return "low"
  if (item.quantity > item.maxStock * 0.8) return "high"
  return "normal"
}

const stockStatusConfig: Record<
  StockStatus,
  { label: string; className: string; icon: typeof AlertTriangle }
> = {
  critical: {
    label: "Out of Stock",
    className:
      "bg-red-50 text-red-700 hover:bg-red-50 dark:bg-red-950 dark:text-red-400",
    icon: AlertTriangle,
  },
  low: {
    label: "Low Stock",
    className:
      "bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-950 dark:text-amber-400",
    icon: ArrowDownCircle,
  },
  normal: {
    label: "Normal",
    className:
      "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  high: {
    label: "High Stock",
    className:
      "bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-950 dark:text-blue-400",
    icon: TrendingUp,
  },
}

interface InventoryTableProps {
  items: InventoryItem[]
  onAdjust: (item: InventoryItem, type: "add" | "remove") => void
}

export function InventoryTable({ items, onAdjust }: InventoryTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[30%] pl-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <button className="flex items-center gap-1.5 hover:text-foreground">
                  Product
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Warehouse
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <button className="flex items-center gap-1.5 hover:text-foreground">
                  Quantity
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Unit
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Last Updated
              </TableHead>
              <TableHead className="w-[60px] pr-6 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Boxes className="size-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      No inventory items found
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const status = getStockStatus(item)
                const StatusIcon = stockStatusConfig[status].icon
                const isLowOrCritical = status === "low" || status === "critical"

                return (
                  <TableRow
                    key={item.id}
                    className={`group ${
                      isLowOrCritical
                        ? "bg-red-50/30 hover:bg-red-50/50 dark:bg-red-950/10 dark:hover:bg-red-950/20"
                        : ""
                    }`}
                  >
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.productName}</span>
                          {isLowOrCritical && (
                            <AlertTriangle className="size-4 text-amber-500" />
                          )}
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">
                          {item.sku}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{item.warehouse}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span
                          className={`font-mono text-sm font-semibold ${
                            status === "critical"
                              ? "text-red-600 dark:text-red-400"
                              : status === "low"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-foreground"
                          }`}
                        >
                          {item.quantity.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Min: {item.minStock} / Max: {item.maxStock}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {item.unit}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`gap-1.5 ${stockStatusConfig[status].className}`}
                      >
                        <StatusIcon className="size-3" />
                        {stockStatusConfig[status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {item.lastUpdated}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                          >
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => onAdjust(item, "add")}
                          >
                            <Plus className="size-4" />
                            Add Stock
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => onAdjust(item, "remove")}
                          >
                            <Minus className="size-4" />
                            Remove Stock
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2">
                            <History className="size-4" />
                            View History
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
