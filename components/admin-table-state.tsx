'use client'

import { AlertCircle, Inbox, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { useLanguage } from '@/lib/language-context'

export function AdminTableState({
  columns,
  loading,
  error,
  emptyMessage,
  onRetry
}: {
  columns: number
  loading: boolean
  error: string | null
  emptyMessage: string
  onRetry: () => void
}) {
  const { t } = useLanguage()
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={columns} className="h-48 whitespace-normal text-center">
        <div className="flex flex-col items-center gap-3 px-4 py-8" role={error ? 'alert' : 'status'}>
          {loading ? (
            <Loader2 className="size-6 animate-spin text-primary" />
          ) : error ? (
            <AlertCircle className="size-7 text-destructive" />
          ) : (
            <Inbox className="size-8 text-muted-foreground/60" />
          )}
          <p className="text-sm text-muted-foreground">{loading ? t.common.loading : error || emptyMessage}</p>
          {!loading && error && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              {t.common.retry}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
