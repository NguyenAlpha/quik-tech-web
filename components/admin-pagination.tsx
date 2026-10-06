'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAdminCopy } from '@/lib/admin-copy'

export function AdminPagination({
  page,
  totalPages,
  disabled,
  onPageChange
}: {
  page: number
  totalPages: number
  disabled: boolean
  onPageChange: (page: number) => void
}) {
  const copy = useAdminCopy()
  if (totalPages === 0) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4">
      <p className="text-xs tabular-nums text-muted-foreground">
        {copy.page} {page + 1} {copy.of} {totalPages}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={disabled || page === 0} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="size-4" />
          {copy.previous}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          {copy.next}
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
