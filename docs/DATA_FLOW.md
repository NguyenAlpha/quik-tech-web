# Data Flow — Luồng Dữ Liệu

## 1. Bức tranh toàn cảnh

```
Trang (page.tsx)
    │
    │  gọi hàm từ
    ▼
lib/api.ts  ──── hiện tại ──→  Mock data trong bộ nhớ
                               (mất khi refresh trang)
    │
    │  tương lai sẽ là
    ▼
fetch() → Spring Boot API → PostgreSQL
```

---

## 2. Mock API hiện tại (lib/api.ts)

Toàn bộ "API" được giả lập trong `lib/api.ts`. Dữ liệu lưu trong biến `let` của module —
tức là chỉ tồn tại trong bộ nhớ, **mất khi refresh trang**.

Mỗi hàm giả lập độ trễ mạng bằng `setTimeout` để cảm giác thật hơn:

```ts
// Ví dụ: getProducts() trả về sau 500ms (giả lập delay mạng)
export async function getProducts(): Promise<Product[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(products), 500)
  })
}
```

### Các hàm hiện có

| Hàm | Mô tả |
|:---|:---|
| `getCategories()` | Lấy danh sách danh mục |
| `getUnits()` | Lấy danh sách đơn vị tính |
| `getProducts()` | Lấy danh sách sản phẩm |
| `getProductById(id)` | Lấy 1 sản phẩm theo id |
| `createProduct(input)` | Tạo sản phẩm mới |
| `updateProduct(input)` | Cập nhật sản phẩm |
| `deleteProduct(id)` | Xóa sản phẩm |
| `getSuppliers()` | Lấy danh sách nhà cung cấp |
| `getSupplierById(id)` | Lấy 1 nhà cung cấp |
| `createSupplier(input)` | Tạo nhà cung cấp |
| `updateSupplier(input)` | Cập nhật nhà cung cấp |
| `deleteSupplier(id)` | Xóa nhà cung cấp |
| `getPurchaseOrders()` | Lấy danh sách đơn nhập |
| `getPurchaseOrderById(id)` | Lấy 1 đơn nhập |
| `createPurchaseOrder(input)` | Tạo đơn nhập |
| `updatePurchaseOrderStatus(id, status)` | Cập nhật trạng thái đơn nhập |
| `deletePurchaseOrder(id)` | Xóa đơn nhập |

---

## 3. Cách một trang dùng API

Pattern chung trong tất cả các trang có dữ liệu:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { getProducts } from '@/lib/api'
import type { Product } from '@/lib/types'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Chạy 1 lần khi component mount — lấy dữ liệu ban đầu
  useEffect(() => {
    getProducts()
      .then(setProducts)
      .finally(() => setIsLoading(false))
  }, [])

  // Sau khi tạo mới: thêm vào state mà không cần fetch lại
  async function handleCreate(input) {
    const newProduct = await createProduct(input)
    setProducts(prev => [...prev, newProduct])
  }

  // Sau khi xóa: lọc ra khỏi state
  async function handleDelete(id) {
    await deleteProduct(id)
    setProducts(prev => prev.filter(p => p.id !== id))
  }
}
```

**Không có global state** — mỗi trang tự quản lý dữ liệu của mình bằng `useState`.
Khi chuyển sang trang khác rồi quay lại, dữ liệu sẽ được fetch lại từ đầu.

---

## 4. TypeScript Types (lib/types.ts)

Tất cả kiểu dữ liệu được định nghĩa trong `lib/types.ts`. Mỗi entity có 3 interface:

```
Product            — dữ liệu đầy đủ từ API (có id, createdAt...)
CreateProductInput — dữ liệu khi tạo mới (không có id)
UpdateProductInput — dữ liệu khi cập nhật (có id, các field còn lại giống Create)
```

Ví dụ:
```ts
interface Product {
  id: string
  name: string
  costPrice: number
  sellingPrice: number
  currentStock: number
  minimumStock: number
  categoryId: string
  unitId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface CreateProductInput {
  name: string
  costPrice: number
  sellingPrice: number
  minimumStock: number
  categoryId: string
  unitId: string
  isActive: boolean
  // currentStock không có — backend tự set = 0
}
```

---

## 5. Kết nối backend thật (việc cần làm)

Khi sẵn sàng kết nối Spring Boot API, chỉ cần **sửa `lib/api.ts`** — phần còn lại của app không cần đổi.

### Bước 1: Thêm biến môi trường

Tạo file `.env.local` ở thư mục `apps/web/`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Bước 2: Thay mock bằng fetch thật

```ts
// TRƯỚC (mock)
export async function getProducts(): Promise<Product[]> {
  return new Promise(resolve => setTimeout(() => resolve(mockProducts), 500))
}

// SAU (gọi API thật)
export async function getProducts(token: string): Promise<Product[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch products')
  const json = await res.json()
  return json.data  // ApiResult<List<ProductResponse>> từ Spring Boot
}
```

### Bước 3: Truyền token vào mọi hàm API

Token JWT lấy từ auth session (sau khi tích hợp đăng nhập).

---

## 6. Mock data có sẵn

**Categories:** Electronics, Office Supplies, Furniture, Consumables, Tools

**Units:** Piece (pcs), Box (box), Kilogram (kg), Meter (m), Liter (L)

**Products:** 3 sản phẩm mẫu — Wireless Mouse, USB-C Hub, A4 Paper Ream

**Suppliers:** 3 nhà cung cấp mẫu — Tech Distributors Inc., Office Solutions Ltd., Global Imports Co.

**Purchase Orders:** 3 đơn mẫu với status: pending, received, completed
