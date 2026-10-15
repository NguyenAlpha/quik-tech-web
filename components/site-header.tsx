"use client"

import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Globe } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"

/** Thanh điều hướng công khai — landing, đăng nhập, đăng ký, setup. */
export function SiteHeader() {
  const { t, language, setLanguage } = useLanguage()
  const tl = t.landing
  const { user, memberships } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <BrandLogo className="size-8" />
          <span className="text-lg font-semibold">QuikTech POS</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
          >
            <Globe className="size-4" />
            {language === "vi" ? "EN" : "VI"}
          </Button>
          <ThemeToggle />
          {user ? (
            // Chưa có business (đang ở /setup) thì chưa vào dashboard được
            memberships.length > 0 && (
              <Button asChild size="sm">
                <Link href="/dashboard">{tl.goToDashboard}</Link>
              </Button>
            )
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">{tl.signIn}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">{tl.getStarted}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
