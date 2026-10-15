import { SiteHeader } from '@/components/site-header'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/40 flex flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center p-4">
        {children}
      </main>
    </div>
  )
}
