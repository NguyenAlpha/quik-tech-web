"use client"

import { useLanguage } from "@/lib/language-context"
import {
  ArrowUpDown,
  Boxes,
  Minus,
  Plus,
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
import type { InventoryItem } from "@/lib/types"

interface InventoryTableProps {
  items: InventoryItem[]
  onAdjust: (item: InventoryItem, type: "add" | "remove") => void
}

export function InventoryTable({ items, onAdjust }: InventoryTableProps) {
  const { t } = useLanguage()
  const ti = t.inventory

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="flex h-32 flex-col items-center justify-center gap-2">
            <Boxes className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{ti.noItems}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="flex flex-col overflow-hidden rounded-xl border sm:hidden">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 border-b bg-card p-4 last:border-b-0">
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-sm">{item.productName}</p>
              <p className="font-mono text-xs text-muted-foreground">{item.productPublicId}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.warehouseName}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-mono text-sm font-semibold">{item.quantity.toLocaleString()}</span>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" className="size-8" onClick={() => onAdjust(item, "add")}>
                  <Plus className="size-4" />
                  <span className="sr-only">{ti.addStock}</span>
                </Button>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => onAdjust(item, "remove")}>
                  <Minus className="size-4" />
                  <span className="sr-only">{ti.removeStock}</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="hidden sm:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[30%] pl-6">
                  <button className="flex items-center gap-1 hover:text-foreground">
                    {ti.colProduct}
                    <ArrowUpDown className="size-3.5" />
                  </button>
                </TableHead>
                <TableHead>{ti.colWarehouse}</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1 hover:text-foreground">
                    {ti.colQuantity}
                    <ArrowUpDown className="size-3.5" />
                  </button>
                </TableHead>
                <TableHead>{ti.colLastUpdated}</TableHead>
                <TableHead className="pr-6 text-right"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="pl-6">
                    <div className="flex flex-col">
                      <span className="font-medium">{item.productName}</span>
                      <span className="font-mono text-xs text-muted-foreground">{item.productPublicId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{item.warehouseName}</span>
                      <span className="font-mono text-xs text-muted-foreground">{item.warehousePublicId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm font-semibold">
                      {item.quantity.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{item.updatedAt}</span>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => onAdjust(item, "add")}
                      >
                        <Plus className="size-4" />
                        <span className="sr-only">{ti.addStock}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => onAdjust(item, "remove")}
                      >
                        <Minus className="size-4" />
                        <span className="sr-only">{ti.removeStock}</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
