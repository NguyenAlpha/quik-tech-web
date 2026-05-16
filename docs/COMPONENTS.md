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
| `input.tsx` | Ô nhập liệu |
| `select.tsx` | Dropdown chọn |
| `badge.tsx` | Tag / nhãn trạng thái |
| `sidebar.tsx` | Sidebar điều hướng |
| `dropdown-menu.tsx` | Menu dropdown |
| `separator.tsx` | Đường kẻ phân cách |
| `skeleton.tsx` | Loading placeholder |
| `tooltip.tsx` | Tooltip khi hover |
| `avatar.tsx` | Avatar chữ cái đầu tên |
| `checkbox.tsx` | Checkbox |
| `textarea.tsx` | Ô nhập nhiều dòng |

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
Khung bố cục chính. Bao gồm sidebar bên trái và vùng nội dung bên phải.
Được dùng trong `app/(dashboard)/layout.tsx` — tự động áp dụng cho tất cả trang dashboard.

### AppSidebar (components/app-sidebar.tsx)
Sidebar điều hướng bên trái. Chứa logo, danh sách menu, và thông tin user.

### DashboardHeader (components/dashboard-header.tsx)
Header trên cùng. Chứa:
- Ô tìm kiếm (UI)
- Toggle ngôn ngữ EN/VI
- Toggle dark/light mode
- Chuông thông báo (UI tĩnh)
- Avatar + tên user thật (lấy từ `useAuth()`)
- Dropdown: nút Logout hoạt động — gọi `logout()` từ `AuthContext`

### PageHeader (components/page-header.tsx)
Component tiêu đề dùng chung ở đầu mỗi trang dashboard:

```tsx
<PageHeader title="Products" subtitle="Manage your product catalog">
  <Button>Add Product</Button>  {/* optional */}
</PageHeader>
```

Props: `title: string`, `subtitle: string`, `children?: React.ReactNode`

### TableFooter (components/table-footer.tsx)
Component hiển thị số lượng bản ghi ở cuối mỗi bảng:

```tsx
<TableFooter filtered={12} total={50} label="products">
  <Badge>3 low stock</Badge>  {/* optional */}
</TableFooter>
// Hiển thị: "Showing 12 of 50 products"
```

Props: `filtered: number`, `total: number`, `label: string`, `children?: React.ReactNode`

---

## 4. Table Components

Mỗi table component nhận dữ liệu qua props và hiển thị trong `Card > Table`.
Trang cha chịu trách nhiệm fetch data và truyền xuống.

### ProductsTable (components/products-table.tsx)
Props: `products: Product[]`, `onDelete: (id: string) => void`

Hiển thị: SKU, tên, giá vốn, giá bán, tồn kho (so với minStockLevel), trạng thái, actions.
Badge tồn kho chuyển đỏ khi `totalStock <= minStockLevel`.

### SuppliersTable (components/suppliers-table.tsx)
Props: `suppliers: Supplier[]`, `onDelete: (id: string) => void`

Hiển thị: tên (+ mã), SĐT, email, địa chỉ, dư nợ, actions.

### CustomersTable (components/customers-table.tsx)
Props: `customers: Customer[]`, `onSelect: (customer: Customer) => void`

Hiển thị: tên (+ mã), SĐT, email, địa chỉ, dư nợ, actions.

### InventoryTable (components/inventory-table.tsx)
Props: `items: InventoryItem[]`, `onAdjust: (item, type) => void`

Hiển thị: tên sản phẩm, warehouse, số lượng, lần cập nhật cuối.
Dropdown menu: Add Stock / Remove Stock → gọi `onAdjust` để mở modal ở trang cha.

### OrdersTable (components/orders-table.tsx)
Props: `orders: Order[]`, `onSelect: (order: Order) => void`

Hiển thị: mã đơn (`orderCode`), customer (publicId hoặc "Guest"), ngày tạo, status badge, tổng tiền.
Status badge: `pending / processing / shipped / completed / cancelled` — mỗi loại có màu và icon.

### PurchaseOrdersTable (components/purchase-orders-table.tsx)
Props: `purchaseOrders: PurchaseOrder[]`, `onDelete`, `onStatusChange`, `isDeleting`

Hiển thị: mã đơn, supplier publicId, ngày tạo, số items, tổng tiền, status selector, nút xóa.
Có thể expand từng row để xem chi tiết items và ghi chú.

### PaymentsTable (components/payments-table.tsx)
Props: `payments: Payment[]`, `onSelect: (payment: Payment) => void`

Hiển thị: id, đối tác (customerPublicId hoặc supplierPublicId), phương thức thanh toán, ghi chú, ngày, số tiền.

---

## 5. Modal Components

Các thao tác tạo mới đều dùng `Dialog` từ Radix UI.
Pattern chung: trang cha quản lý `open` state và truyền callback `onSubmit`.

```tsx
const [isModalOpen, setIsModalOpen] = useState(false)

async function handleCreate(data: CreateProductInput) {
  const newItem = await createProduct(data)
  setProducts(prev => [...prev, newItem])
}

<AddProductModal
  open={isModalOpen}
  onOpenChange={setIsModalOpen}
  onSubmit={handleCreate}
  isLoading={isLoading}
/>
```

### AddProductModal (components/add-product-modal.tsx)
Fields: SKU, tên, mô tả, giá vốn, giá bán, minStockLevel, category (dropdown từ API), unit (dropdown từ API), isActive.

### AddSupplierModal (components/add-supplier-modal.tsx)
Fields: tên, SĐT, email, địa chỉ.

### AddPurchaseOrderModal (components/add-purchase-order-modal.tsx)
Fields: supplier (dropdown), warehouse (dropdown), order code (optional), ghi chú.
Phần Items: chọn product → tự điền đơn giá → nhập số lượng → tính tổng.

Props bổ sung: `suppliers: Supplier[]`, `products: Product[]`, `warehouses: Warehouse[]`

---

## 6. Dashboard Components

### KPI Cards (components/kpi-cards.tsx)
Hiển thị các chỉ số tổng quan: doanh thu, số đơn, khách hàng, tồn kho.
**Hiện tại dữ liệu vẫn hardcode** — chưa kết nối API.

### SalesChart (components/sales-chart.tsx)
Biểu đồ doanh thu theo tháng, dùng **Recharts**.
**Hiện tại dữ liệu vẫn hardcode** — chưa kết nối API.

### LowStockAlert (components/low-stock-alert.tsx)
Hiển thị danh sách sản phẩm sắp hết hàng.
**Hiện tại dữ liệu vẫn hardcode** — chưa kết nối API.

---

## 7. Utility Functions

### cn() — lib/utils.ts
Hàm merge Tailwind CSS class, tránh xung đột:
```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  "px-4 py-2 rounded",
  isActive && "bg-green-100",
  isError && "border-red-500"
)}>
```

### formatCurrency() — lib/utils.ts
```tsx
formatCurrency(1234567)  // "1,234,567 ₫" hoặc tùy locale
```

### getInitials() — lib/utils.ts
```tsx
getInitials("Nguyen Van A")  // "NVA"
getInitials("John Doe")      // "JD"
```

### useLanguage() — lib/language-context.tsx
```tsx
const { t, language, setLanguage } = useLanguage()

<h1>{t.products.title}</h1>       // "Products" hoặc "Sản phẩm"
<button>{t.common.save}</button>  // "Save" hoặc "Lưu"
```

### useAuth() — lib/auth-context.tsx
```tsx
const { user, token, storeId, login, logout } = useAuth()

// user: { id, publicId, username, email, fullName, ... }
// storeId: number | null — ID của store đang hoạt động
```

---

## 8. Thêm component mới từ Shadcn/ui

Nếu cần dùng component chưa có (ví dụ: Calendar, Tabs):

```bash
# Trong thư mục apps/web
npx shadcn@latest add calendar
npx shadcn@latest add tabs
```

Component sẽ được thêm vào `components/ui/` — có thể dùng ngay.
