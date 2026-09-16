"use client"

import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ShoppingCart,
  Warehouse,
  Truck,
  Users,
  Building2,
  LayoutDashboard,
  Globe,
  ArrowRight,
  Check,
} from "lucide-react"

export default function LandingPage() {
  const { t, language, setLanguage } = useLanguage()
  const tl = t.landing
  const { user } = useAuth()

  const features = [
    { icon: ShoppingCart, title: tl.fPosTitle, desc: tl.fPosDesc },
    { icon: Warehouse, title: tl.fInventoryTitle, desc: tl.fInventoryDesc },
    { icon: Truck, title: tl.fPurchaseTitle, desc: tl.fPurchaseDesc },
    { icon: Users, title: tl.fPartnersTitle, desc: tl.fPartnersDesc },
    { icon: Building2, title: tl.fMultistoreTitle, desc: tl.fMultistoreDesc },
    { icon: LayoutDashboard, title: tl.fAnalyticsTitle, desc: tl.fAnalyticsDesc },
  ]

  const plans = [
    { name: tl.planFree, desc: tl.planFreeDesc, highlight: false },
    { name: tl.planBasic, desc: tl.planBasicDesc, highlight: true },
    { name: tl.planPro, desc: tl.planProDesc, highlight: false },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">Q</span>
            </div>
            <span className="text-lg font-semibold">QuikTech POS</span>
          </div>
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
            {user ? (
              <Button asChild size="sm">
                <Link href="/dashboard">{tl.goToDashboard}</Link>
              </Button>
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

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            {tl.heroTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            {tl.heroSubtitle}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link href={user ? "/dashboard" : "/register"}>
                {user ? tl.goToDashboard : tl.ctaPrimary}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            {!user && (
              <Button asChild size="lg" variant="outline">
                <Link href="/login">{tl.ctaSecondary}</Link>
              </Button>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/30">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight">{tl.featuresTitle}</h2>
              <p className="mt-3 text-muted-foreground">{tl.featuresSubtitle}</p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <Card key={f.title} className="border-muted">
                  <CardContent className="space-y-3 p-6">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <f.icon className="size-5" />
                    </div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Plans */}
        <section className="border-t">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight">{tl.plansTitle}</h2>
              <p className="mt-3 text-muted-foreground">{tl.plansSubtitle}</p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {plans.map((p) => (
                <Card key={p.name} className={p.highlight ? "border-primary shadow-md" : "border-muted"}>
                  <CardContent className="space-y-4 p-6">
                    <h3 className="text-lg font-semibold">{p.name}</h3>
                    <p className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {p.desc}
                    </p>
                    <Button asChild variant={p.highlight ? "default" : "outline"} className="w-full">
                      <Link href={user ? "/dashboard" : "/register"}>
                        {user ? tl.goToDashboard : tl.getStarted}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-t bg-primary/5">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 text-center sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight">{tl.ctaTitle}</h2>
            <p className="mt-3 text-muted-foreground">{tl.ctaSubtitle}</p>
            <Button asChild size="lg" className="mt-8 gap-2">
              <Link href={user ? "/dashboard" : "/register"}>
                {user ? tl.goToDashboard : tl.ctaPrimary}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded bg-primary">
              <span className="text-xs font-bold text-primary-foreground">Q</span>
            </div>
            <span className="font-medium text-foreground">QuikTech POS</span>
          </div>
          <p>© {new Date().getFullYear()} QuikTech POS. {tl.footerRights}</p>
        </div>
      </footer>
    </div>
  )
}
