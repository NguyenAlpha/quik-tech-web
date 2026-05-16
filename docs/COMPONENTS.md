# Components — Hướng Dẫn UI Components

## 1. Shadcn/ui là gì

Project dùng **Shadcn/ui** — không phải là một thư viện npm thông thường.
Shadcn/ui **copy trực tiếp source code** component vào project, nằm trong `components/ui/`.

Điều này có nghĩa:
- Bạn **sở hữu hoàn toàn** code của component — có thể sửa thoải mái
- Không phụ thuộc vào version update của thư viện ngoài
- Mỗi component là file `.tsx` riêng trong `components/ui/`

Shadcn/ui được xây dựng trên **Radix UI** (xử lý accessibility, keyboard navigation)
và styled bằng **Tailwind CSS**.

---

## 2. Base Components (components/ui/)

Các component nền tảng từ Shadcn/ui — dùng trực tiếp trong toàn app:

| Component | Dùng cho |
|:---|:---|
| `button.tsx` | Nút bấm (variant: default, outline, ghost, destructive...) |
| `card.tsx` | Thẻ nội dung có border |
| `table.tsx` | Bảng dữ liệu |
| `dialog.tsx` | Modal popup |
| `form.tsx` | Wrapper form tích hợp React Hook Form |
| `input.tsx` | Ô nhập liệu |
| `select.tsx` | Dropdown chọn |
| `badge.tsx` | Tag / nhãn trạng thái |
| `sidebar.tsx` | Sidebar điều hướng |
| `toast.tsx` | Thông báo (dùng qua hook `useToast`) |
| `dropdown-menu.tsx` | Menu dropdown |
| `separator.tsx` | Đường kẻ phân cách |
| `skeleton.tsx` | Loading placeholder |
| `tooltip.tsx` | Tooltip khi hover |

Cách dùng điển hình:
```tsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Sản phẩm</CardTitle>
  </CardHeader>
  <CardContent>
    <Button variant="outline">Thêm mới</Button>
  </CardContent>
</Card>
```

---

## 3. Layout Components

### DashboardLayout (components/dashboard-layout.tsx)
Khung bố cục chính của toàn app. Bao gồm sidebar bên trái và vùng nội dung bên phải.
Được dùng **một lần** trong `app/layout.tsx` — không cần import lại trong từng trang.

### AppSidebar (components/app-sidebar.tsx)
Sidebar điều hướng bên trái. Chứa logo, danh sách menu, và thông tin user.
Các menu item map trực tiếp đến các route trong `app/`.

### DashboardHeader (components/dashboard-header.tsx)
Header trên cùng. Chứa:
- Ô tìm kiếm
- Toggle ngôn ngữ EN/VI
- Toggle dark/light mode
- Avatar user + dropdown (logout — chưa có chức năng)

---

## 4. Page-specific Components

### KPI Cards (components/kpi-cards.tsx)
Hiển thị các chỉ số tổng quan trên dashboard: doanh thu, số đơn, khách hàng, tồn kho.
Dữ liệu hiện tại là hardcode.

### SalesChart (components/sales-chart.tsx)
Biểu đồ doanh thu theo tháng, dùng thư viện **Recharts**.
Dữ liệu hiện tại là hardcode.

### LowStockAlert (components/low-stock-alert.tsx)
Hiển thị danh sách sản phẩm sắp hết hàng (currentStock < minimumStock).

### ProductsTable (components/products-table.tsx)
Bảng danh sách sản phẩm có:
- Tìm kiếm theo tên
- Xóa sản phẩm (với confirm)
- Hiển thị badge trạng thái active/inactive

### SuppliersTable / PurchaseOrdersTable
Tương tự ProductsTable nhưng cho nhà cung cấp và đơn nhập.

---

## 5. Modal Components

Các thao tác tạo mới đều dùng modal (Dialog từ Radix UI):

### AddProductModal (components/add-product-modal.tsx)
Form tạo sản phẩm mới với:
- Validation bằng **Zod** schema
- Quản lý form state bằng **React Hook Form**
- Dropdown chọn Category và Unit (lấy từ `getCategories()`, `getUnits()`)

Pattern chung của modal:
```tsx
// Trang cha quản lý state mở/đóng modal
const [isModalOpen, setIsModalOpen] = useState(false)

// Callback sau khi tạo thành công
function handleProductCreated(newProduct: Product) {
  setProducts(prev => [...prev, newProduct])
  setIsModalOpen(false)
}

<AddProductModal
  open={isModalOpen}
  onOpenChange={setIsModalOpen}
  onProductCreated={handleProductCreated}
/>
```

---

## 6. Utility Functions

### cn() — lib/utils.ts
Hàm merge Tailwind CSS class, tránh xung đột:
```tsx
import { cn } from '@/lib/utils'

// Kết hợp class cố định + class điều kiện
<div className={cn(
  "px-4 py-2 rounded",           // luôn có
  isActive && "bg-green-100",    // chỉ khi active
  isError && "border-red-500"    // chỉ khi có lỗi
)}>
```

### useToast() — hooks/use-toast.ts
Hook hiển thị toast notification:
```tsx
const { toast } = useToast()

toast({
  title: "Thành công",
  description: "Sản phẩm đã được tạo.",
})
```

### useLanguage() — lib/language-context.tsx
Hook lấy bản dịch:
```tsx
const { t, language, setLanguage } = useLanguage()

<h1>{t.products.title}</h1>       // "Products" hoặc "Sản phẩm"
<button>{t.common.save}</button>  // "Save" hoặc "Lưu"
```

---

## 7. Thêm component mới từ Shadcn/ui

Nếu cần dùng component chưa có (ví dụ: Calendar, Tabs):

```bash
# Trong thư mục apps/web
npx shadcn@latest add calendar
npx shadcn@latest add tabs
```

Component sẽ được thêm vào `components/ui/` — có thể dùng ngay.
