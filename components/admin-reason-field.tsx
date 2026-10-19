'use client'

import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAdminCopy } from '@/lib/admin-copy'

export function AdminReasonField({
  value,
  onChange,
  disabled,
  maxLength = 500
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  maxLength?: number
}) {
  const id = useId()
  const copy = useAdminCopy()
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{copy.reasonOptional}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        disabled={disabled}
        rows={2}
        placeholder={copy.reasonPlaceholder}
      />
    </div>
  )
}
