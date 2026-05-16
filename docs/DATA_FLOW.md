# Data Flow — Luồng Dữ Liệu

## 1. Bức tranh toàn cảnh

```
Trang (page.tsx)
    │
    │  gọi hàm từ
    ▼
lib/api.ts
    │
    │  apiFetch<T>()
    ▼
fetch() → Spring Boot API (/api/stores/{storeId}/...)
    │
    │  ApiResult<T> response
    ▼
PostgreSQL
```

---

## 2. apiFetch — Helper gọi API (lib/api.ts)

Tất cả API calls đều đi qua hàm `apiFetch<T>()`:

```ts
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth_token')
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  const body = await res.json()
  if (!res.ok || !body.success) {
    throw new Error(body.error?.message || 'Request failed')
  }
  return body.data  // Unwrap ApiResult<T>
}
```

Hàm này tự động:
- Đính kèm JWT token vào header `Authorization`
- Unwrap `ApiResult<T>` wrapper từ backend (`body.data`)
- Throw `Error` với message từ backend nếu request thất bại

---

## 3. ApiResult — Response format từ backend

Spring Boot trả về mọi response theo format:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Khi lỗi:
```json
{
  "success": false,
  "data": null,
  "error": { "code": "NOT_FOUND", "message": "Product not found" }
}
```

`apiFetch` kiểm tra `body.success` và throw nếu false — trang không cần xử lý format này.

---

## 4. Store-scoped endpoints

Mọi dữ liệu nghiệp vụ đều gắn với một **store** cụ thể.
URL pattern: `/api/stores/{storeId}/...`

Hai helper trong `api.ts`:

```ts
function getStoreId(): number {
  const id = localStorage.getItem('auth_store_id')
  if (!id) throw new Error('No store selected')
  return parseInt(id)
}

function storeUrl(path: string) {
  return `/api/stores/${getStoreId()}${path}`
}
```

Ví dụ sử dụng:
```ts
// Thay vì hardcode /api/stores/1/products
export async function getProducts(): Promise<Product[]> {
  const data = await apiFetch<any[]>(storeUrl('/products'))
  return data.map(mapProduct)
}
```

`storeId` được lấy từ `storeMemberships[0].storeId` sau khi login và lưu vào localStorage.

---

## 5. Mapper functions

Backend trả về tên field theo convention Java (`publicId`, `costPrice`...).
Mỗi entity có một mapper function chuyển đổi sang TypeScript type của frontend:

```ts
function mapProduct(p: any): Product {
  return {
    id: p.publicId,        // publicId → id
    sku: p.sku ?? '',
    name: p.name,
    costPrice: Number(p.costPrice),
    sellingPrice: Number(p.sellingPrice),
    minStockLevel: p.minStockLevel ?? 0,
    totalStock: Number(p.totalStock ?? 0),
    categoryId: p.categoryId ? String(p.categoryId) : '',
    unitId: p.unitId ? String(p.unitId) : '',
    isActive: p.isActive ?? true,
    createdAt: p.createdAt ?? '',
    updatedAt: p.updatedAt ?? '',
  }
}
```

Tương tự: `mapSupplier()`, `mapCustomer()`, `mapOrder()`, `mapPurchaseOrder()`.

---

## 6. Các hàm API hiện có

### Auth
| Hàm | Endpoint | Mô tả |
|:---|:---|:---|
| `loginUser(data)` | `POST /api/auth/login` | Đăng nhập, trả về JWT + user + storeMemberships |
| `registerUser(data)` | `POST /api/auth/register` | Đăng ký tài khoản mới |

### Catalog
| Hàm | Endpoint | Mô tả |
|:---|:---|:---|
| `getCategories()` | `GET /categories` | Danh sách danh mục |
| `getUnits()` | `GET /units` | Danh sách đơn vị tính |

### Products
| Hàm | Endpoint | Mô tả |
|:---|:---|:---|
| `getProducts()` | `GET /products` | Danh sách sản phẩm |
| `createProduct(input)` | `POST /products` | Tạo sản phẩm |
| `deleteProduct(id)` | `DELETE /products/{id}` | Xóa sản phẩm |

### Suppliers
| Hàm | Endpoint | Mô tả |
|:---|:---|:---|
| `getSuppliers()` | `GET /suppliers` | Danh sách nhà cung cấp |
| `createSupplier(input)` | `POST /suppliers` | Tạo nhà cung cấp |
| `deleteSupplier(id)` | `DELETE /suppliers/{id}` | Xóa nhà cung cấp |

### Customers
| Hàm | Endpoint | Mô tả |
|:---|:---|:---|
| `getCustomers()` | `GET /customers` | Danh sách khách hàng |
| `createCustomer(input)` | `POST /customers` | Tạo khách hàng |

### Warehouses & Inventory
| Hàm | Endpoint | Mô tả |
|:---|:---|:---|
| `getWarehouses()` | `GET /warehouses` | Danh sách kho |
| `getInventoryItems()` | `GET /inventory` | Tồn kho theo warehouse |

### Orders
| Hàm | Endpoint | Mô tả |
|:---|:---|:---|
| `getOrders()` | `GET /orders` | Danh sách đơn bán |

### Purchase Orders
| Hàm | Endpoint | Mô tả |
|:---|:---|:---|
| `getPurchaseOrders()` | `GET /purchases` | Danh sách đơn nhập |
| `createPurchaseOrder(input)` | `POST /purchases` | Tạo đơn nhập |
| `deletePurchaseOrder(id)` | `PUT /purchases/{id}/cancel` | Hủy đơn nhập |
| `updatePurchaseOrderStatus(id, status)` | `PUT /purchases/{id}/receive` | Xác nhận nhận hàng |

### Payments
| Hàm | Endpoint | Mô tả |
|:---|:---|:---|
| `getPayments()` | `GET /payments` | Danh sách thanh toán |

> Tất cả endpoint trên đều có prefix `/api/stores/{storeId}` — được xử lý bởi `storeUrl()`.

---

## 7. Cách một trang dùng API

Pattern chung trong tất cả các trang có dữ liệu:

```tsx
'use client'
import { useState, useEffect, useMemo } from 'react'
import { getProducts, createProduct, deleteProduct } from '@/lib/api'
import type { Product, CreateProductInput } from '@/lib/types'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch dữ liệu khi component mount
  useEffect(() => {
    getProducts()
      .then(setProducts)
      .finally(() => setIsPageLoading(false))
  }, [])

  // Filter client-side bằng useMemo
  const filtered = useMemo(() =>
    products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [products, searchQuery]
  )

  // Sau khi tạo mới: thêm vào state, không fetch lại
  async function handleCreate(input: CreateProductInput) {
    const newProduct = await createProduct(input)
    setProducts(prev => [...prev, newProduct])
  }

  // Sau khi xóa: lọc ra khỏi state
  async function handleDelete(id: string) {
    await deleteProduct(id)
    setProducts(prev => prev.filter(p => p.id !== id))
  }
}
```

**Không có global state** — mỗi trang tự quản lý dữ liệu bằng `useState`.
Filter/search đều thực hiện **client-side** bằng `useMemo`.

---

## 8. TypeScript Types (lib/types.ts)

Tất cả types khớp với backend DTO. Pattern đặt tên:

```
Product            — dữ liệu đầy đủ từ API (có id = publicId, createdAt...)
CreateProductInput — payload khi tạo mới (không có id)
UpdateProductInput — payload khi cập nhật (extends Create + có id)
```

Ví dụ thực tế:
```ts
interface Product {
  id: string          // = publicId từ backend
  sku: string
  name: string
  costPrice: number
  sellingPrice: number
  minStockLevel: number
  totalStock: number
  categoryId: string
  unitId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface CreateProductInput {
  sku: string
  name: string
  description: string
  costPrice: number
  sellingPrice: number
  minStockLevel: number
  categoryId: string
  unitId: string
  isActive: boolean
}
```

---

## 9. Biến môi trường

| Biến | Mặc định | Mô tả |
|:---|:---|:---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | URL của Spring Boot backend |

Tạo file `apps/web/.env.local` để override:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```
