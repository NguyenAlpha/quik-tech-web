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

Page/component dùng các hàm public trong `lib/api.ts`. API JSON đã xác thực đi qua
`apiFetch<T>()`; import multipart và export file dùng chung `authenticatedFetch()`
để giữ cùng hành vi refresh. Login/register và API admin có luồng xác thực riêng,
nhưng dùng cùng bộ phân tích lỗi HTTP.

```ts
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return readApiResponse<T>(await authenticatedFetch(path, { ...init, headers }))
}
```

**Những gì `apiFetch` lo:**
- Đính kèm JWT token vào `Authorization: Bearer ...`
- Parse JSON response
- Unwrap `ApiResult<T>` — trả về `body.data` trực tiếp
- Throw `ApiError` với `code`, `status`, `retryAt` và `retryAfterSeconds` khi lỗi HTTP
- Chỉ thử refresh khi request nhận 401; không tự retry 429

**Những gì caller phải lo:**
- Truyền đúng kiểu generic `<T>` để TypeScript suy luận
- Bắt lỗi bằng `try/catch` ở tầng page và hiển thị qua `errorMessage(err, t)`

Chi tiết xử lý 429, giữ phiên khi refresh lỗi tạm thời và nút đếm ngược nằm trong
[RATE_LIMITING.md](RATE_LIMITING.md).

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
| `getPlans` | GET | `/api/plans` — công khai, không gửi token (landing + trang subscription) |
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
| `getProductLimit` | GET | `/products/limit` |
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
| `bulkAdjustInventory` | POST | `/inventory/adjust/bulk` |
| `bulkTransferInventory` | POST | `/inventory/transfer/bulk` |
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
| `getAdminPlans` (`lib/plans.ts`) | GET | `/api/admin/plans` |
| `updateAdminPlan` (`lib/plans.ts`) | PUT | `/api/admin/plans/{code}` |
| `getTrafficReport` (`lib/traffic.ts`) | GET | `/api/admin/traffic?range=1h\|24h\|7d\|30d` |
| `getSystemHealth` (`lib/traffic.ts`) | GET | `/api/admin/traffic/system` |
| `adminGetPendingInvoices` | GET | `/api/admin/subscriptions/invoices/pending` |
| `adminConfirmInvoice` | POST | `/api/admin/subscriptions/invoices/{id}/confirm` |
| `adminRejectInvoice` | POST | `/api/admin/subscriptions/invoices/{id}/reject` |
| `adminGetUsers` | GET | `/api/admin/users` |
| `adminSetUserStatus` | PATCH | `/api/admin/users/{userId}/status` |
| `adminDeleteUser` | DELETE | `/api/admin/users/{userId}` |
