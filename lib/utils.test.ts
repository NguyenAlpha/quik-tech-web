import { describe, expect, it } from 'vitest'
import { cn, formatCurrency, getInitials } from './utils'

describe('web utilities', () => {
  it('merges conditional Tailwind classes', () => {
    expect(cn('px-2', false && 'hidden', 'px-4')).toBe('px-4')
  })

  it('creates uppercase initials from a name', () => {
    expect(getInitials('Nguyen Van An')).toBe('NV')
    expect(getInitials('QuikTech')).toBe('Q')
  })

  it('formats supported currencies for the UI', () => {
    expect(formatCurrency(125000, 'VND')).toContain('125.000')
    expect(formatCurrency(12.5, 'USD')).toContain('12.50')
  })
})
