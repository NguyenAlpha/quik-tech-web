# API — Kết Nối Backend

## 1. Cấu hình URL

```ts
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
```

Tạo file `apps/web/.env.local` để override URL:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 2. apiFetch — Core helper

Tất cả API calls đều đi qua `apiFetch<T>()`. Gọi trực tiếp `fetch()` trong các page/component
là **sai pattern** — phải dùng hàm này.

```ts
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('auth_token')
    : null

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

  return body.data
}
```

**Những gì `apiFetch` lo:**
- Đính kèm JWT token vào `Authorization: Bearer ...`
- Parse JSON response
- Unwrap `ApiResult<T>` — trả về `body.data` trực tiếp
- Throw `Error` có message từ backend khi lỗi

**Những gì caller phải lo:**
- Truyền đúng kiểu generic `<T>` để TypeScript suy luận
- Bắt lỗi bằng `try/catch` ở tầng page

---

## 3. ApiResult — Cấu trúc response backend

Spring Boot wrap mọi response theo format `ApiResult<T>`:

```json
// Thành công
{
  "success": true,
  "data": { "id": "abc123", "name": "Product A", ... },
  "error": null
}

// Lỗi
{
  "success": false,
  "data": null,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with id abc123 not found"
  }
}
```

Với danh sách:
```json
{
  "success": true,
  "data": [ { "id": "..." }, { "id": "..." } ],
  "error": null
}
```

`apiFetch` tự xử lý format này — tầng page nhận trực tiếp `T` (không cần unwrap).

---

## 4. Store-scoped endpoints

Mọi dữ liệu nghiệp vụ thuộc về một store cụ thể.
URL pattern của backend: `/api/stores/{storeId}/{resource}`

Hai helper xử lý việc này:

```ts
function getStoreId(): number {
  const id = typeof window !== 'undefined'
    ? localStorage.getItem('auth_store_id')
    : null
  if (!id) throw new Error('No store selected')
  return parseInt(id)
}

function storeUrl(path: string): string {
  return `/api/stores/${getStoreId()}${path}`
}
```

Cách dùng:
```ts
// Đúng — dùng storeUrl()
export async function getProducts(): Promise<Product[]> {
  const data = await apiFetch<any[]>(storeUrl('/products'))
  return data.map(mapProduct)
}

// Sai — hardcode storeId
const data = await apiFetch('/api/stores/1/products')
```

---

## 5. Thêm API function mới

### Ví dụ: GET danh sách

```ts
export async function getWarehouses(): Promise<Warehouse[]> {
  const data = await apiFetch<any[]>(storeUrl('/warehouses'))
  return data.map((w) => ({
    id: w.publicId,
    name: w.name,
    address: w.address ?? '',
    isActive: w.isActive ?? true,
  }))
}
```

### Ví dụ: POST tạo mới

```ts
export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  const data = await apiFetch<any>(storeUrl('/suppliers'), {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return mapSupplier(data)
}
```

### Ví dụ: DELETE

```ts
export async function deleteProduct(id: string): Promise<void> {
  await apiFetch<void>(storeUrl(`/products/${id}`), { method: 'DELETE' })
}
```

### Ví dụ: PUT update

```ts
export async function updatePurchaseOrderStatus(id: string, status: string): Promise<void> {
  await apiFetch<void>(storeUrl(`/purchases/${id}/receive`), { method: 'PUT' })
}
```

---

## 6. Xử lý lỗi ở tầng page

`apiFetch` throw `Error` — tầng page bắt và hiển thị cho user:

```tsx
const [errorMessage, setErrorMessage] = useState<string | null>(null)

async function handleCreate(data: CreateProductInput) {
  setIsLoading(true)
  setErrorMessage(null)
  try {
    const newProduct = await createProduct(data)
    setProducts(prev => [...prev, newProduct])
  } catch (error) {
    // error.message là message từ backend (đã unwrap bởi apiFetch)
    setErrorMessage(error instanceof Error ? error.message : 'Something went wrong')
  } finally {
    setIsLoading(false)
  }
}
```

---

## 7. Auth endpoints (không dùng apiFetch)

Login và register **không dùng `apiFetch`** vì chưa có token lúc gọi:

```ts
export async function loginUser(data: LoginInput): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const body = await res.json()
  if (!res.ok || !body.success) {
    throw new Error(body.error?.message || 'Invalid email or password')
  }
  return body.data
}
```

---

## 8. Bảng tất cả endpoints

### Auth (không dùng storeUrl)
| Hàm | Method | Path |
|:---|:---|:---|
| `loginUser` | POST | `/api/auth/login` |
| `registerUser` | POST | `/api/auth/register` |

### Business (dùng businessUrl)
| Hàm | Method | Path |
|:---|:---|:---|
| `getBusiness` | GET | `/api/businesses/{id}` |
| `updateBusiness` | PATCH | `/api/businesses/{id}` |
| `getBusinessSubscription` | GET | `/api/businesses/{id}/subscription` |
| `createStore` | POST | `/api/businesses/{id}/stores` |
| `requestUpgrade` | POST | `/api/businesses/{id}/subscription/upgrade` |
| `scheduleDowngrade` | POST | `/api/businesses/{id}/subscription/downgrade` |
| `cancelScheduledDowngrade` | DELETE | `/api/businesses/{id}/subscription/downgrade` |
| `submitPaymentRef` | PATCH | `/api/businesses/{id}/subscription/invoices/{invId}/payment` |
| `getInvoicesPage` | GET | `/api/businesses/{id}/subscription/invoices` |

### Store-scoped (dùng storeUrl)
| Hàm | Method | Path |
|:---|:---|:---|
| `getCategories` | GET | `/categories` |
| `getUnits` | GET | `/units` |
| `getProducts` / `searchProducts` | GET | `/products` / `/products/search` |
| `createProduct` | POST | `/products` |
| `updateProduct` | PUT | `/products/{id}` |
| `deleteProduct` | DELETE | `/products/{id}` |
| `getSuppliers` | GET | `/suppliers` |
| `createSupplier` | POST | `/suppliers` |
| `updateSupplier` | PUT | `/suppliers/{id}` |
| `deleteSupplier` | DELETE | `/suppliers/{id}` |
| `getCustomers` | GET | `/customers` |
| `createCustomer` | POST | `/customers` |
| `getWarehouses` | GET | `/warehouses` |
| `getInventoryItems` | GET | `/inventory` |
| `adjustInventory` | POST | `/inventory/adjust` |
| `getOrdersPage` | GET | `/orders` |
| `createOrder` | POST | `/orders` |
| `completeOrder` | PUT | `/orders/{id}/complete` |
| `cancelOrder` | PUT | `/orders/{id}/cancel` |
| `payOrder` | PUT | `/orders/{id}/pay` |
| `getReturnOrders` | GET | `/returns` |
| `getReturnOrder` | GET | `/returns/{id}` |
| `createReturnOrder` | POST | `/returns` |
| `completeReturnOrder` | PUT | `/returns/{id}/complete` |
| `cancelReturnOrder` | PUT | `/returns/{id}/cancel` |
| `getPurchaseOrdersPage` | GET | `/purchases` |
| `createPurchaseOrder` | POST | `/purchases` |
| `updatePurchaseOrderStatus` | PUT | `/purchases/{id}/receive` hoặc `/cancel` |
| `getPaymentsPage` | GET | `/payments` |
| `getDashboard` | GET | `/dashboard` |

### Admin (path tuyệt đối, yêu cầu SUPER_ADMIN)
| Hàm | Method | Path |
|:---|:---|:---|
| `adminGetBusinesses` | GET | `/api/businesses` |
| `adminGetSubscription` | GET | `/api/admin/subscriptions/{businessId}` |
| `adminChangePlan` | PATCH | `/api/admin/subscriptions/{businessId}/plan` |
| `adminGetPendingInvoices` | GET | `/api/admin/subscriptions/invoices/pending` |
| `adminConfirmInvoice` | POST | `/api/admin/subscriptions/invoices/{id}/confirm` |
| `adminRejectInvoice` | POST | `/api/admin/subscriptions/invoices/{id}/reject` |
| `adminGetUsers` | GET | `/api/admin/users` |
| `adminSetUserStatus` | PATCH | `/api/admin/users/{userId}/status` |
| `adminDeleteUser` | DELETE | `/api/admin/users/{userId}` |
