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

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[30%] pl-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <button className="flex items-center gap-1.5 hover:text-foreground">
                  {ti.colProduct}
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {ti.colWarehouse}
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <button className="flex items-center gap-1.5 hover:text-foreground">
                  {ti.colQuantity}
                  <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {ti.colLastUpdated}
              </TableHead>
              <TableHead className="w-[60px] pr-6 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Boxes className="size-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">{ti.noItems}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} className="group">
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
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
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
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
