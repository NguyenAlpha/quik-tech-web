# Architecture — Cấu trúc & Cách Next.js Hoạt Động

## 1. Folder Structure

```
apps/web/
├── app/                    # Tất cả các trang (App Router)
│   ├── layout.tsx          # Root layout — bọc toàn bộ app
│   ├── page.tsx            # Trang Dashboard (route /)
│   ├── globals.css         # CSS toàn cục + Tailwind
│   ├── products/
│   │   └── page.tsx        # Route /products
│   ├── suppliers/
│   │   └── page.tsx        # Route /suppliers
│   ├── purchase-orders/
│   │   └── page.tsx        # Route /purchase-orders
│   ├── orders/
│   │   └── page.tsx        # Route /orders
│   ├── customers/
│   │   └── page.tsx        # Route /customers
│   ├── inventory/
│   │   └── page.tsx        # Route /inventory
│   ├── payments/
│   │   └── page.tsx        # Route /payments
│   └── settings/
│       └── page.tsx        # Route /settings
│
├── components/             # UI components tái sử dụng
│   ├── ui/                 # Shadcn/ui base components (button, card, table...)
│   ├── app-sidebar.tsx     # Sidebar điều hướng
│   ├── dashboard-layout.tsx # Layout chính (sidebar + header + content)
│   ├── dashboard-header.tsx # Header trên cùng
│   ├── theme-provider.tsx  # Wrapper cho dark/light mode
│   ├── language-switcher.tsx # Toggle EN/VI
│   ├── theme-toggle.tsx    # Toggle dark mode
│   ├── add-product-modal.tsx # Modal tạo sản phẩm
│   ├── add-supplier-modal.tsx # Modal tạo nhà cung cấp
│   ├── add-purchase-order-modal.tsx # Modal tạo đơn nhập
│   ├── products-table.tsx  # Bảng danh sách sản phẩm
│   ├── suppliers-table.tsx # Bảng danh sách nhà cung cấp
│   ├── purchase-orders-table.tsx # Bảng đơn nhập
│   ├── kpi-cards.tsx       # Thẻ KPI trên dashboard
│   ├── sales-chart.tsx     # Biểu đồ doanh thu
│   └── low-stock-alert.tsx # Cảnh báo hàng sắp hết
│
├── lib/                    # Logic dùng chung
│   ├── api.ts              # Tất cả API calls (hiện là mock data)
│   ├── types.ts            # TypeScript interfaces cho tất cả entity
│   ├── language-context.tsx # React Context quản lý ngôn ngữ
│   ├── translations.ts     # Bản dịch EN + VI
│   ├── utils.ts            # Hàm tiện ích (cn để merge Tailwind class)
│   └── status-colors.ts    # Mapping màu theo trạng thái
│
├── hooks/                  # Custom React hooks
│   ├── use-toast.ts        # Hook hiển thị toast notification
│   └── use-mobile.ts       # Hook detect màn hình mobile
│
└── public/                 # File tĩnh (icon, ảnh)
```

---

## 2. App Router hoạt động ra sao

Next.js App Router dùng **cấu trúc folder để định nghĩa route**:

```
app/products/page.tsx  →  URL: /products
app/orders/page.tsx    →  URL: /orders
app/page.tsx           →  URL: /   (dashboard)
```

Quy tắc:
- Mỗi folder = 1 segment trong URL
- File `page.tsx` trong folder = nội dung trang đó
- File `layout.tsx` = khung bọc bên ngoài, **không re-render** khi chuyển trang

---

## 3. Root Layout — layout.tsx

`app/layout.tsx` là file chạy **đầu tiên và bọc toàn bộ app**:

```tsx
<ThemeProvider>          // Quản lý dark/light mode
  <LanguageProvider>     // Quản lý ngôn ngữ EN/VI
    <DashboardLayout>    // Sidebar + Header + vùng nội dung
      {children}         // Nội dung từng trang thay vào đây
    </DashboardLayout>
  </LanguageProvider>
</ThemeProvider>
```

Khi bạn chuyển từ `/products` sang `/orders`:
- `ThemeProvider`, `LanguageProvider`, `DashboardLayout` **giữ nguyên** (không reload)
- Chỉ phần `{children}` thay đổi — đây là lý do sidebar không nhấp nháy khi chuyển trang

---

## 4. Server Component vs Client Component

Đây là khái niệm quan trọng nhất của Next.js App Router.

### Server Component (mặc định)
- **Chạy trên server**, không có trong trình duyệt
- Không dùng được: `useState`, `useEffect`, event handlers (`onClick`...)
- Ưu điểm: nhanh hơn, SEO tốt hơn, không gửi JS xuống browser

### Client Component
- **Chạy trong trình duyệt**
- Cần thêm `'use client'` ở đầu file
- Dùng được mọi thứ của React: state, effect, event handlers

```tsx
// Server Component — KHÔNG có 'use client'
export default function ProductsPage() {
  // Không dùng useState ở đây được
  return <ProductsTable />
}

// Client Component — CÓ 'use client'
'use client'
export function ProductsTable() {
  const [products, setProducts] = useState([]) // OK
  // ...
}
```

**Trong project này:** Hầu hết `page.tsx` là Server Component (chỉ render layout),
còn các component có tương tác (bảng, modal, form) đều là Client Component với `'use client'`.

---

## 5. Luồng render một trang

Khi user vào `/products`:

```
1. Next.js nhận request /products
2. Chạy app/layout.tsx (Server) → render khung DashboardLayout
3. Chạy app/products/page.tsx (Server) → render nội dung trang
4. Gặp <ProductsTable /> là Client Component
5. Gửi HTML sẵn + JS của ProductsTable xuống browser
6. Browser "hydrate" — gắn event listeners vào HTML đã có
7. ProductsTable chạy useEffect → gọi getProducts() từ lib/api.ts
8. setState(data) → render lại bảng với dữ liệu
```

---

## 6. Global State — Providers

Project dùng **React Context** cho 2 state toàn cục:

### ThemeProvider (next-themes)
- Quản lý dark/light mode
- Lưu preference vào `localStorage` key `theme-preference`
- Component `ThemeToggle` ở header để toggle

### LanguageProvider (tự viết — lib/language-context.tsx)
- Quản lý ngôn ngữ EN / VI
- Lưu vào `localStorage` key `language-preference`
- Hook `useLanguage()` để lấy object dịch `t` trong bất kỳ component nào:

```tsx
const { t } = useLanguage()
return <h1>{t.products.title}</h1>  // "Products" hoặc "Sản phẩm"
```

Toàn bộ text dịch nằm trong `lib/translations.ts`.
