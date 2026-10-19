"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { getPlans } from "@/lib/api"
import { planLimitLines } from "@/lib/plan-limits"
import type { Plan } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { SiteHeader } from "@/components/site-header"
import { BrandLogo } from "@/components/brand-logo"
import {
  ShoppingCart,
  Warehouse,
  Truck,
  Users,
  Building2,
  LayoutDashboard,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react"

/** Ảnh chụp app đặt trong khung trình duyệt giả. */
function ScreenshotFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card/60 p-1.5 shadow-2xl shadow-primary/10 ring-1 ring-foreground/5 backdrop-blur", className)}>
      <div className="flex items-center gap-1.5 px-2.5 py-2">
        <span className="size-2.5 rounded-full bg-red-400/80" />
        <span className="size-2.5 rounded-full bg-amber-400/80" />
        <span className="size-2.5 rounded-full bg-emerald-400/80" />
      </div>
      <div className="overflow-hidden rounded-lg border">{children}</div>
    </div>
  )
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

export default function LandingPage() {
  const { t } = useLanguage()
  const tl = t.landing
  const { user } = useAuth()
  const ctaHref = user ? "/dashboard" : "/register"

  const features = [
    { icon: ShoppingCart, title: tl.fPosTitle, desc: tl.fPosDesc },
    { icon: Warehouse, title: tl.fInventoryTitle, desc: tl.fInventoryDesc },
    { icon: Truck, title: tl.fPurchaseTitle, desc: tl.fPurchaseDesc },
    { icon: Users, title: tl.fPartnersTitle, desc: tl.fPartnersDesc },
    { icon: Building2, title: tl.fMultistoreTitle, desc: tl.fMultistoreDesc },
    { icon: LayoutDashboard, title: tl.fAnalyticsTitle, desc: tl.fAnalyticsDesc },
  ]

  const showcases = [
    {
      eyebrow: tl.sc1Eyebrow, title: tl.sc1Title, desc: tl.sc1Desc,
      points: [tl.sc1P1, tl.sc1P2, tl.sc1P3],
      image: "/landing/app-customers.png", alt: tl.sc1ImageAlt,
    },
    {
      eyebrow: tl.sc2Eyebrow, title: tl.sc2Title, desc: tl.sc2Desc,
      points: [tl.sc2P1, tl.sc2P2, tl.sc2P3],
      image: "/landing/app-products.png", alt: tl.sc2ImageAlt,
    },
  ]

  const faqs = [
    { q: tl.faqQ1, a: tl.faqA1 },
    { q: tl.faqQ2, a: tl.faqA2 },
    { q: tl.faqQ3, a: tl.faqA3 },
    { q: tl.faqQ4, a: tl.faqA4 },
  ]

  // Giới hạn gói lấy từ API (admin sửa được); lỗi tải thì chỉ hiện tên gói
  const [planData, setPlanData] = useState<Plan[]>([])
  useEffect(() => { getPlans().then(setPlanData).catch(() => {}) }, [])

  const plans = [
    { code: "FREE", name: tl.planFree, highlight: false },
    { code: "BASIC", name: tl.planBasic, highlight: true },
    { code: "PRO", name: tl.planPro, highlight: false },
  ].map(p => {
    const data = planData.find(d => d.code === p.code)
    return { ...p, limits: data ? planLimitLines(data, t) : [] }
  })

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Nav */}
      <SiteHeader />

      <main className="flex-1 overflow-x-hidden">
        {/* Hero */}
        <section className="relative isolate">
          {/* Nền: lưới mờ + quầng sáng màu thương hiệu */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_40%,transparent_100%)]"
          />
          <div aria-hidden className="absolute left-1/2 top-0 -z-10 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

          <div className="mx-auto w-full max-w-6xl px-4 pt-20 text-center sm:px-6 sm:pt-28">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-sm text-muted-foreground backdrop-blur">
                <Sparkles className="size-4 text-primary" />
                {tl.heroBadge}
              </span>
              <h1 className="mx-auto mt-6 max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
                <span className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
                  {tl.heroTitle}
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
                {tl.heroSubtitle}
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 gap-2 px-7 text-base shadow-lg shadow-primary/25">
                  <Link href={ctaHref}>
                    {user ? tl.goToDashboard : tl.ctaPrimary}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                {!user && (
                  <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
                    <Link href="/login">{tl.ctaSecondary}</Link>
                  </Button>
                )}
              </div>
              <p className="mt-5 text-sm text-muted-foreground">{tl.heroNote}</p>
            </div>

            <div className="relative mx-auto mt-16 max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-1000 sm:mt-20">
              <div aria-hidden className="absolute -inset-x-10 top-10 -z-10 h-2/3 rounded-full bg-primary/25 blur-3xl" />
              <ScreenshotFrame>
                <Image src="/landing/app-dashboard.png" alt={tl.heroImageAlt} width={2880} height={1800} priority sizes="(min-width: 1024px) 1024px, 100vw" className="block dark:hidden" />
                <Image src="/landing/app-dashboard-dark.png" alt={tl.heroImageAlt} width={2880} height={1800} sizes="(min-width: 1024px) 1024px, 100vw" className="hidden dark:block" />
              </ScreenshotFrame>
              {/* Mờ dần phần đáy ảnh vào nền */}
              <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-t from-background to-transparent" />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
          <SectionHeading eyebrow={tl.featuresEyebrow} title={tl.featuresTitle} subtitle={tl.featuresSubtitle} />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
              >
                <div aria-hidden className="absolute -right-10 -top-10 size-32 rounded-full bg-primary/5 transition-colors group-hover:bg-primary/10" />
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/20">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-5 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Showcase: ảnh app thật, xen kẽ trái/phải */}
        <section className="border-y bg-muted/30">
          <div className="mx-auto w-full max-w-6xl space-y-24 px-4 py-24 sm:px-6">
            {showcases.map((s, i) => (
              <div key={s.title} className="grid items-center gap-10 lg:grid-cols-5 lg:gap-14">
                <div className={cn("lg:col-span-2", i % 2 === 1 && "lg:order-last")}>
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary">{s.eyebrow}</p>
                  <h3 className="mt-3 text-balance text-2xl font-bold tracking-tight sm:text-3xl">{s.title}</h3>
                  <p className="mt-4 text-muted-foreground">{s.desc}</p>
                  <ul className="mt-6 space-y-3">
                    {s.points.map(point => (
                      <li key={point} className="flex items-start gap-3 text-sm">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Check className="size-3.5" />
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                <ScreenshotFrame className="lg:col-span-3">
                  <Image src={s.image} alt={s.alt} width={2880} height={1800} sizes="(min-width: 1024px) 640px, 100vw" />
                </ScreenshotFrame>
              </div>
            ))}
          </div>
        </section>

        {/* Plans */}
        <section id="pricing" className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
          <SectionHeading eyebrow={tl.plansEyebrow} title={tl.plansTitle} subtitle={tl.plansSubtitle} />
          <div className="mx-auto mt-14 grid max-w-5xl items-start gap-6 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-card p-7",
                  p.highlight && "border-primary shadow-xl shadow-primary/10 ring-1 ring-primary md:-mt-4 md:pb-11 md:pt-11",
                )}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    {tl.planRecommended}
                  </span>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <ul className="mt-6 flex-1 space-y-3">
                  {p.limits.map(limit => (
                    <li key={limit} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {limit}
                    </li>
                  ))}
                </ul>
                <Button asChild variant={p.highlight ? "default" : "outline"} className="mt-8 w-full">
                  <Link href={ctaHref}>
                    {user ? tl.goToDashboard : tl.getStarted}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t bg-muted/30">
          <div className="mx-auto w-full max-w-3xl px-4 py-24 sm:px-6">
            <SectionHeading eyebrow={tl.faqEyebrow} title={tl.faqTitle} />
            <Accordion type="single" collapsible className="mt-12 rounded-2xl border bg-card px-6">
              {faqs.map((f, i) => (
                <AccordionItem key={f.q} value={`faq-${i}`}>
                  <AccordionTrigger className="text-base">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
          <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 px-6 py-16 text-center text-white shadow-2xl shadow-primary/20 sm:px-16">
            <div aria-hidden className="absolute -left-20 -top-20 -z-10 size-72 rounded-full bg-white/10 blur-3xl" />
            <div aria-hidden className="absolute -bottom-24 -right-16 -z-10 size-80 rounded-full bg-white/10 blur-3xl" />
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{tl.ctaTitle}</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg opacity-90">{tl.ctaSubtitle}</p>
            <Button asChild size="lg" variant="secondary" className="mt-10 h-12 gap-2 px-7 text-base">
              <Link href={ctaHref}>
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
            <BrandLogo className="size-6" />
            <span className="font-medium text-foreground">QuikTech POS</span>
          </div>
          <p>© {new Date().getFullYear()} QuikTech POS. {tl.footerRights}</p>
        </div>
      </footer>
    </div>
  )
}
