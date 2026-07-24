import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authToken = request.cookies.get('auth_token')?.value
  const adminToken = request.cookies.get('admin_token')?.value

  // ── /admin/* ──────────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      // Đã đăng nhập admin → vào stats luôn
      if (adminToken) return NextResponse.redirect(new URL('/admin/stats', request.url))
      return NextResponse.next()
    }
    // Mọi route /admin/* khác yêu cầu admin_token
    if (!adminToken) return NextResponse.redirect(new URL('/admin/login', request.url))
    return NextResponse.next()
  }

  // ── /login, /register ────────────────────────────────────────────────────
  if (pathname === '/login' || pathname === '/register') {
    if (authToken) return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.next()
  }

  // ── /setup ───────────────────────────────────────────────────────────────
  if (pathname === '/setup') {
    if (!authToken) return NextResponse.redirect(new URL('/login', request.url))
    return NextResponse.next()
  }

  // ── Dashboard routes (tất cả còn lại) ───────────────────────────────────
  if (!authToken) return NextResponse.redirect(new URL('/login', request.url))
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Bỏ qua static files và _next internals
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|.*\\.png$|.*\\.svg$).*)',
  ],
}
