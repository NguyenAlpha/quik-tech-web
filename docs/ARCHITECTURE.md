# Architecture — Cấu trúc & Cách Next.js Hoạt Động

## 1. Folder Structure

```
apps/web/
├── middleware.ts               # Bảo vệ route — redirect nếu chưa login
│
├── app/                        # Tất cả các trang (App Router)
│   ├── layout.tsx              # Root layout — chỉ chứa Providers
│   ├── globals.css             # CSS toàn cục + Tailwind
│   │
│   ├── (auth)/                 # Route group — trang auth (không có sidebar)
│   │   ├── layout.tsx          # Layout căn giữa màn hình
│   │   ├── login/page.tsx      # Route /login
│   │   └── register/page.tsx   # Route /register
│   │
│   └── (dashboard)/            # Route group — trang dashboard (có sidebar)
│       ├── layout.tsx          # Layout bọc DashboardLayout
│       ├── page.tsx            # Route / (Dashboard)
│       ├── products/page.tsx
│       ├── suppliers/page.tsx
│       ├── purchase-orders/page.tsx
│       ├── orders/page.tsx
│       ├── customers/page.tsx
│       ├── inventory/page.tsx
│       ├── payments/page.tsx
│       └── settings/page.tsx
│
├── components/                 # UI components tái sử dụng
│   ├── ui/                     # Shadcn/ui base components (button, card, table...)
│   ├── app-sidebar.tsx         # Sidebar điều hướng
│   ├── dashboard-layout.tsx    # Layout chính (sidebar + header + content)
│   ├── dashboard-header.tsx    # Header — hiển thị user thật, logout hoạt động
│   ├── page-header.tsx         # Component tiêu đề trang (title + subtitle + action)
│   ├── table-footer.tsx        # Component footer bảng (showing X of Y)
│   ├── theme-provider.tsx      # Wrapper cho dark/light mode
│   ├── language-switcher.tsx   # Toggle EN/VI
│   ├── theme-toggle.tsx        # Toggle dark mode
│   ├── add-product-modal.tsx
│   ├── add-supplier-modal.tsx
│   ├── add-purchase-order-modal.tsx
│   ├── products-table.tsx
│   ├── suppliers-table.tsx
│   ├── purchase-orders-table.tsx
│   ├── inventory-table.tsx
│   ├── customers-table.tsx
│   ├── orders-table.tsx
│   ├── payments-table.tsx
│   ├── kpi-cards.tsx
│   ├── sales-chart.tsx
│   └── low-stock-alert.tsx
│
├── lib/                        # Logic dùng chung
│   ├── api.ts                  # Tất cả API calls — gọi thật đến Spring Boot
│   ├── types.ts                # TypeScript interfaces khớp với backend DTO
│   ├── auth-context.tsx        # React Context quản lý auth (token, user, storeId)
│   ├── language-context.tsx    # React Context quản lý ngôn ngữ
│   ├── translations.ts         # Bản dịch EN + VI
│   ├── utils.ts                # cn(), getInitials(), formatCurrency()
│   └── status-colors.ts        # Mapping màu theo trạng thái
│
├── hooks/
│   ├── use-toast.ts
│   └── use-mobile.ts
│
└── public/                     # File tĩnh
```

> **Route groups** như `(auth)` và `(dashboard)` là tính năng của Next.js App Router.
> Tên trong ngoặc đơn **không xuất hiện trong URL** — chỉ dùng để nhóm các trang
> có chung layout mà không ảnh hưởng đến route.

---

## 2. App Router hoạt động ra sao

Next.js App Router dùng **cấu trúc folder để định nghĩa route**:

```
app/(dashboard)/products/page.tsx  →  URL: /products
app/(dashboard)/orders/page.tsx    →  URL: /orders
app/(auth)/login/page.tsx          →  URL: /login
app/(dashboard)/page.tsx           →  URL: /   (dashboard)
```

Quy tắc:
- Mỗi folder = 1 segment trong URL (trừ route groups trong ngoặc đơn)
- File `page.tsx` trong folder = nội dung trang đó
- File `layout.tsx` = khung bọc bên ngoài, **không re-render** khi chuyển trang

---

## 3. Root Layout — layout.tsx

`app/layout.tsx` chỉ chứa các **Providers** — không có layout UI nào:

```tsx
<ThemeProvider>        // Quản lý dark/light mode
  <LanguageProvider>   // Quản lý ngôn ngữ EN/VI
    <AuthProvider>     // Quản lý auth: token, user, storeId
      {children}
    </AuthProvider>
  </LanguageProvider>
</ThemeProvider>
```

Layout UI (sidebar, header) nằm trong `app/(dashboard)/layout.tsx`:

```tsx
// app/(dashboard)/layout.tsx
export default function Layout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
```

Khi user vào `/products`:
- Root layout render các Providers (giữ nguyên, không re-render)
- `(dashboard)/layout.tsx` render `DashboardLayout` (sidebar + header)
- `products/page.tsx` render nội dung trang

Khi user vào `/login`:
- Root layout render các Providers
- `(auth)/layout.tsx` render màn hình căn giữa (không có sidebar)
- `login/page.tsx` render form đăng nhập

---

## 4. Middleware — Bảo vệ Route

`middleware.ts` chạy **trước mỗi request**, kiểm tra cookie `auth_token`:

```ts
// Public routes không cần đăng nhập
const publicRoutes = ['/login', '/register']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value

  if (publicRoutes.includes(pathname)) {
    // Đã login rồi → redirect về dashboard
    if (token) return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.next()
  }

  // Chưa login → redirect về /login
  if (!token) return NextResponse.redirect(new URL('/login', request.url))
  return NextResponse.next()
}
```

Token được lưu vào cookie khi login (song song với localStorage) để middleware
có thể đọc phía server — vì middleware không có quyền đọc localStorage.

---

## 5. Server Component vs Client Component

### Server Component (mặc định)
- Chạy trên server, không có trong trình duyệt
- Không dùng được: `useState`, `useEffect`, event handlers
- Ưu điểm: nhanh hơn, SEO tốt hơn

### Client Component
- Chạy trong trình duyệt
- Cần thêm `'use client'` ở đầu file
- Dùng được mọi thứ của React

**Trong project này:** Tất cả `page.tsx` trong `(dashboard)/` đều là Client Component
vì cần `useState`/`useEffect` để fetch dữ liệu từ API. Đây là trade-off chấp nhận được
ở giai đoạn hiện tại.

---

## 6. Global State — Providers

Project dùng **React Context** cho 3 state toàn cục:

### ThemeProvider (next-themes)
- Quản lý dark/light mode
- Lưu preference vào `localStorage` key `theme-preference`

### LanguageProvider (lib/language-context.tsx)
- Quản lý ngôn ngữ EN / VI
- Lưu vào `localStorage` key `language-preference`
- Hook `useLanguage()` để lấy object dịch `t`

### AuthProvider (lib/auth-context.tsx)
- Quản lý JWT token, thông tin user, danh sách store membership
- Lưu vào `localStorage` và `cookie`
- Hook `useAuth()` để truy cập `{ user, token, storeId, login, logout }`
- Xem chi tiết trong `AUTH.md`
