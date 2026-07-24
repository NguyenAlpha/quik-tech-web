import type { Metadata } from 'next'

import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Inter as V0_Font_Inter, Geist_Mono as V0_Font_Geist_Mono, Source_Serif_4 as V0_Font_Source_Serif_4 } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/lib/language-context"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from 'sonner'

// Initialize fonts
const _inter = V0_Font_Inter({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })
const _geistMono = V0_Font_Geist_Mono({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })
const _sourceSerif_4 = V0_Font_Source_Serif_4({ subsets: ['latin'], weight: ["200","300","400","500","600","700","800","900"] })

export const metadata: Metadata = {
  title: 'QuikTech — Quản lý bán hàng & kho cho SMB',
  description: 'Nền tảng quản lý bán hàng, kho, công nợ và nhiều chi nhánh cho doanh nghiệp nhỏ. Bán hàng, nhập hàng, trả hàng, báo cáo — tất cả trong một.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className="bg-background" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          storageKey="theme-preference"
        >
          <LanguageProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
        <Toaster richColors position="top-right" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
