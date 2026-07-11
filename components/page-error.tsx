'use client'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  message?: string
  onRetry?: () => void
}

export function PageError({ message, onRetry }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
        <AlertCircle className="size-6 text-red-600 dark:text-red-400" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{message || 'Something went wrong'}</p>
        <p className="mt-1 text-sm text-muted-foreground">Please try again or contact support.</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="size-4" />
          Try again
        </Button>
      )}
    </div>
  )
}
