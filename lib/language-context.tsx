'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { translations, Language, Translations } from '@/lib/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Get language preference from localStorage
    const savedLanguage = localStorage.getItem('language-preference') as Language | null
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'vi')) {
      setLanguageState(savedLanguage)
    } else {
      // Default to English
      setLanguageState('en')
      localStorage.setItem('language-preference', 'en')
    }
    setIsHydrated(true)
  }, [])

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
    localStorage.setItem('language-preference', newLanguage)
  }

  if (!isHydrated) {
    // Return a minimal provider during hydration to prevent mismatches
    return (
      <LanguageContext.Provider
        value={{
          language: 'en',
          setLanguage: () => {},
          t: translations.en,
        }}
      >
        {children}
      </LanguageContext.Provider>
    )
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language] as Translations,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
