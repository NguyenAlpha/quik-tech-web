'use client'

import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language-context'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-secondary/30 p-1">
      <Button
        variant={language === 'en' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('en')}
        className="h-7 w-12 text-xs font-medium"
      >
        EN
      </Button>
      <Button
        variant={language === 'vi' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('vi')}
        className="h-7 w-12 text-xs font-medium"
      >
        VI
      </Button>
    </div>
  )
}
