import type {
  Category, CreateCategoryInput,
  Unit, CreateUnitInput,
  Product, ProductDetail, PriceHistory, CreateProductInput,
  Supplier, CreateSupplierInput,
  Customer, CreateCustomerInput,
  Warehouse,
  InventoryItem,
  Order, CreateOrderInput,
  PurchaseOrder, CreatePurchaseOrderInput,
  ReturnOrder, CreateReturnOrderInput,
  Payment, CreatePaymentInput,
  LoginInput, RegisterInput, AuthResponse,
  PagedResult,
  Business, BusinessSubscription, UpdateBusinessInput,
  SubscriptionInvoice, BankTransferInfo, UpgradeResponse,
  DashboardData,
  AdminUser,
  AdminStats,
} from "./types"
import { PurchaseOrderStatus } from "./types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export class ApiError extends Error {
  constructor(public code: string, message: string) {
    super(message)
    this.name = "ApiError"
  }
}

// ─── Core fetch helper ────────────────────────────────────────────────────────

let _redirectingToLogin = false
let _refreshPromise: Promise<string | null> | null = null

function clearAuthAndRedirect() {
  if (_redirectingToLogin) return
  _redirectingToLogin = true
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
  localStorage.removeItem('auth_business_id')
  localStorage.removeItem('auth_store_id')
  localStorage.removeItem('auth_memberships')
  localStorage.removeItem('auth_refresh_token')
  document.cookie = 'auth_token=; path=/; max-age=0'
  window.location.href = '/login'
}

async function tryRefreshToken(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise
  _refreshPromise = (async () => {
    const refreshToken = localStorage.getItem('auth_refresh_token')
    if (!refreshToken) return null
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) return null
      const body = await res.json()
      if (!body.success) return null
      const newToken: string = body.data.accessToken
      const newRefresh: string | undefined = body.data.refreshToken
      localStorage.setItem('auth_token', newToken)
      if (newRefresh) localStorage.setItem('auth_refresh_token', newRefresh)
      document.cookie = `auth_token=${newToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      return newToken
    } catch {
      return null
    } finally {
      _refreshPromise = null
    }
  })()
  return _refreshPromise
}

async function adminApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      document.cookie = 'admin_token=; path=/admin; max-age=0'
      window.location.href = '/admin/login'
    }
    throw new ApiError("UNAUTHORIZED", "Session expired. Please log in again.")
  }

  const body = await res.json()
  if (!res.ok || !body.success) {
    throw new ApiError(body.error?.code ?? "UNKNOWN", body.error?.message ?? "Request failed")
  }
  return body.data
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
  let res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (res.status === 401) {
    const newToken = await tryRefreshToken()
    if (newToken) {
      res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newToken}`,
          ...init?.headers,
        },
      })
    }
    if (res.status === 401) {
      clearAuthAndRedirect()
      throw new ApiError("UNAUTHORIZED", "Session expired. Please log in again.")
    }
  }

  const body = await res.json()
  if (!res.ok || !body.success) {
    throw new ApiError(body.error?.code ?? "UNKNOWN", body.error?.message ?? "Request failed")
  }
  return body.data
}

function getStoreId(): number {
  const id = typeof window !== "undefined" ? localStorage.getItem("auth_store_id") : null
  if (!id) throw new Error("No store selected")
  return parseInt(id)
}

function storeUrl(path: string) {
  return `/api/stores/${getStoreId()}${path}`
}

function getBusinessId(): number {
  const id = typeof window !== "undefined" ? localStorage.getItem("auth_business_id") : null
  if (!id) throw new Error("No business selected")
  return parseInt(id)
}

// Như getStoreId nhưng không throw — dùng cho API mà storeId là tùy chọn
// (backend tự fallback store đầu tiên của business khi null)
function getStoreIdOrNull(): number | null {
  const id = typeof window !== "undefined" ? localStorage.getItem("auth_store_id") : null
  return id ? parseInt(id) : null
}

async function downloadFile(path: string, filename: string): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (res.status === 401) {
    const newToken = await tryRefreshToken()
    if (newToken) {
      const res2 = await fetch(`${API_BASE}${path}`, {
        headers: { Authorization: `Bearer ${newToken}` },
      })
      if (res2.ok) {
        const blob = await res2.blob()
        triggerDownload(blob, filename)
        return
      }
    }
    clearAuthAndRedirect()
    throw new ApiError("UNAUTHORIZED", "Session expired")
  }
  if (!res.ok) throw new ApiError("EXPORT_FAILED", "Export failed")
  const blob = await res.blob()
  triggerDownload(blob, filename)
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportOrdersExcel(from?: string, to?: string): Promise<void> {
  const qs = new URLSearchParams()
  if (from) qs.set("from", from)
  if (to) qs.set("to", to)
  const query = qs.toString()
  await downloadFile(storeUrl(`/export/orders${query ? `?${query}` : ""}`), "orders.xlsx")
}

export async function exportInventoryExcel(): Promise<void> {
  await downloadFile(storeUrl("/export/inventory"), "inventory.xlsx")
}

function businessUrl(path: string) {
  return `/api/businesses/${getBusinessId()}${path}`
}

// ─── Businesses ──────────────────────────────────────────────────────────────

// Idempotent: nếu user đã là OWNER của một business, backend trả về business
// hiện có kèm store/warehouse đầu tiên — có thể null khi business chưa có store
export async function createDefaultBusiness(): Promise<{
  business: { id: number; name: string }
  store: { id: number; name: string } | null
  warehouse: { id: number; name: string } | null
}> {
  return apiFetch("/api/businesses/default", { method: "POST" })
}

export async function getBusiness(businessId: number): Promise<Business> {
  return apiFetch<Business>(`/api/businesses/${businessId}`)
}

export async function getBusinessSubscription(businessId: number): Promise<BusinessSubscription> {
  return apiFetch<BusinessSubscription>(`/api/businesses/${businessId}/subscription`)
}

export async function updateBusiness(businessId: number, input: UpdateBusinessInput): Promise<Business> {
  return apiFetch<Business>(`/api/businesses/${businessId}`, { method: "PATCH", body: JSON.stringify(input) })
}

export async function createStore(businessId: number, input: { name: string; address?: string; phone?: string; email?: string }): Promise<{ id: number; name: string }> {
  return apiFetch(`/api/businesses/${businessId}/stores`, { method: "POST", body: JSON.stringify(input) })
}

// ─── Subscription Invoices ────────────────────────────────────────────────────

export async function scheduleDowngrade(
  businessId: number,
  plan: string,
): Promise<BusinessSubscription> {
  return apiFetch<BusinessSubscription>(
    `/api/businesses/${businessId}/subscription/downgrade`,
    { method: 'POST', body: JSON.stringify({ plan }) },
  )
}

export async function cancelScheduledDowngrade(businessId: number): Promise<BusinessSubscription> {
  return apiFetch<BusinessSubscription>(
    `/api/businesses/${businessId}/subscription/downgrade`,
    { method: 'DELETE' },
  )
}

export async function requestUpgrade(
  businessId: number,
  plan: string,
  billingCycle: string,
): Promise<UpgradeResponse> {
  const data = await apiFetch<any>(
    `/api/businesses/${businessId}/subscription/upgrade`,
    { method: 'POST', body: JSON.stringify({ plan, billingCycle }) },
  )
  return { invoice: mapInvoice(data.invoice), bankInfo: data.bankInfo as BankTransferInfo }
}

export async function submitPaymentRef(
  businessId: number,
  invoiceId: number,
  bankTransferRef: string,
): Promise<SubscriptionInvoice> {
  return mapInvoice(
    await apiFetch<any>(
      `/api/businesses/${businessId}/subscription/invoices/${invoiceId}/payment`,
      { method: 'PATCH', body: JSON.stringify({ bankTransferRef }) },
    ),
  )
}

export async function cancelInvoice(businessId: number, invoiceId: number): Promise<void> {
  await apiFetch<void>(
    `/api/businesses/${businessId}/subscription/invoices/${invoiceId}`,
    { method: 'DELETE' },
  )
}

export async function getSubscriptionBankInfo(businessId: number): Promise<BankTransferInfo> {
  return apiFetch<BankTransferInfo>(`/api/businesses/${businessId}/subscription/bank-info`)
}

export async function getInvoicesPage(
  businessId: number,
  params: { page?: number; size?: number },
): Promise<PagedResult<SubscriptionInvoice>> {
  const qs = new URLSearchParams({
    page: String(params.page ?? 0),
    size: String(params.size ?? 20),
  })
  const data = await apiFetch<any>(`/api/businesses/${businessId}/subscription/invoices?${qs}`)
  return { ...data, content: data.content.map(mapInvoice) }
}

export async function adminGetBusinesses(): Promise<Business[]> {
  return adminApiFetch<Business[]>('/api/businesses')
}

export async function adminGetSubscription(businessId: number): Promise<BusinessSubscription> {
  return adminApiFetch<BusinessSubscription>(`/api/admin/subscriptions/${businessId}`)
}

export async function adminChangePlan(businessId: number, plan: string, billingCycle?: string): Promise<BusinessSubscription> {
  // billingCycle bắt buộc với gói trả phí (backend dùng tính expiresAt); FREE thì bỏ trống
  return adminApiFetch<BusinessSubscription>(
    `/api/admin/subscriptions/${businessId}/plan`,
    { method: 'PATCH', body: JSON.stringify({ plan, billingCycle: billingCycle ?? null }) },
  )
}

export async function adminGetPendingInvoices(params: {
  page?: number
  size?: number
}): Promise<PagedResult<SubscriptionInvoice>> {
  const qs = new URLSearchParams({
    page: String(params.page ?? 0),
    size: String(params.size ?? 20),
  })
  const data = await adminApiFetch<any>(`/api/admin/subscriptions/invoices/pending?${qs}`)
  return { ...data, content: data.content.map(mapInvoice) }
}

export async function adminConfirmInvoice(
  invoiceId: number,
  adminNote?: string,
): Promise<SubscriptionInvoice> {
  return mapInvoice(
    await adminApiFetch<any>(
      `/api/admin/subscriptions/invoices/${invoiceId}/confirm`,
      { method: 'POST', body: JSON.stringify({ adminNote: adminNote || null }) },
    ),
  )
}

export async function adminRejectInvoice(
  invoiceId: number,
  adminNote: string,
): Promise<SubscriptionInvoice> {
  return mapInvoice(
    await adminApiFetch<any>(
      `/api/admin/subscriptions/invoices/${invoiceId}/reject`,
      { method: 'POST', body: JSON.stringify({ adminNote }) },
    ),
  )
}

function mapInvoice(i: any): SubscriptionInvoice {
  return {
    id: i.id,
    businessId: i.businessId,
    plan: i.plan,
    billingCycle: i.billingCycle,
    amount: Number(i.amount),
    status: i.status,
    bankTransferRef: i.bankTransferRef ?? null,
    adminNote: i.adminNote ?? null,
    periodStart: i.periodStart ?? '',
    periodEnd: i.periodEnd ?? '',
    paidAt: i.paidAt ?? null,
    confirmedAt: i.confirmedAt ?? null,
    createdAt: i.createdAt ?? '',
    updatedAt: i.updatedAt ?? '',
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function loginUser(data: LoginInput): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const body = await res.json()
  if (!res.ok || !body.success) {
    throw new Error(body.error?.message || "Invalid email or password")
  }
  return body.data
}

export async function registerUser(data: RegisterInput): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const body = await res.json()
  if (!res.ok || !body.success) {
    throw new Error(body.error?.message || "Registration failed")
  }
  return body.data
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const data = await apiFetch<any[]>(businessUrl("/categories"))
  return data.map((c) => ({ id: c.publicId, name: c.name, description: c.description ?? "" }))
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const data = await apiFetch<any>(businessUrl("/categories"), { method: "POST", body: JSON.stringify(input) })
  return { id: data.publicId, name: data.name, description: data.description ?? "" }
}

export async function updateCategory(id: string, input: CreateCategoryInput): Promise<Category> {
  const data = await apiFetch<any>(businessUrl(`/categories/${id}`), { method: "PUT", body: JSON.stringify(input) })
  return { id: data.publicId, name: data.name, description: data.description ?? "" }
}

export async function deleteCategory(id: string): Promise<void> {
  await apiFetch<void>(businessUrl(`/categories/${id}`), { method: "DELETE" })
}

// ─── Units ────────────────────────────────────────────────────────────────────

export async function getUnits(): Promise<Unit[]> {
  const data = await apiFetch<any[]>(businessUrl("/units"))
  return data.map((u) => ({ id: u.publicId, name: u.name, abbreviation: u.abbreviation }))
}

export async function createUnit(input: CreateUnitInput): Promise<Unit> {
  const data = await apiFetch<any>(businessUrl("/units"), { method: "POST", body: JSON.stringify(input) })
  return { id: data.publicId, name: data.name, abbreviation: data.abbreviation }
}

export async function updateUnit(id: string, input: CreateUnitInput): Promise<Unit> {
  const data = await apiFetch<any>(businessUrl(`/units/${id}`), { method: "PATCH", body: JSON.stringify(input) })
  return { id: data.publicId, name: data.name, abbreviation: data.abbreviation }
}

export async function deleteUnit(id: string): Promise<void> {
  await apiFetch<void>(businessUrl(`/units/${id}`), { method: "DELETE" })
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  const data = await apiFetch<any[]>(businessUrl("/products"))
  return data.map(mapProduct)
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const data = await apiFetch<any>(businessUrl("/products"), {
    method: "POST",
    body: JSON.stringify({
      sku: input.sku,
      name: input.name,
      description: input.description,
      categoryPublicId: input.categoryId || null,
      unitPublicId: input.unitId,
      costPrice: input.costPrice,
      sellingPrice: input.sellingPrice,
      minStockLevel: input.minStockLevel,
      isActive: input.isActive,
    }),
  })
  return mapProduct(data)
}

export async function importProducts(file: File): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_BASE}${businessUrl('/products/import')}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (res.status === 401) {
    const newToken = await tryRefreshToken()
    if (newToken) {
      const res2 = await fetch(`${API_BASE}${businessUrl('/products/import')}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${newToken}` },
        body: formData,
      })
      if (res2.status !== 401) {
        const body2 = await res2.json()
        if (!res2.ok || !body2.success) throw new ApiError(body2.error?.code ?? 'UNKNOWN', body2.error?.message ?? 'Request failed')
        return body2.data
      }
    }
    clearAuthAndRedirect()
    throw new ApiError('UNAUTHORIZED', 'Session expired')
  }
  const body = await res.json()
  if (!res.ok || !body.success) throw new ApiError(body.error?.code ?? 'UNKNOWN', body.error?.message ?? 'Request failed')
  return body.data
}

export async function searchProducts(params: {
  q?: string
  isActive?: boolean
  categoryPublicId?: string
  page?: number
  size?: number
  sortBy?: 'name' | 'updatedAt'
  sort?: 'asc' | 'desc'
}): Promise<PagedResult<Product>> {
  const qs = new URLSearchParams()
  if (params.q) qs.set('q', params.q)
  if (params.isActive !== undefined) qs.set('isActive', String(params.isActive))
  if (params.categoryPublicId) qs.set('categoryPublicId', params.categoryPublicId)
  qs.set('page', String(params.page ?? 0))
  qs.set('size', String(params.size ?? 20))
  if (params.sortBy) qs.set('sortBy', params.sortBy)
  if (params.sort) qs.set('sort', params.sort)
  const data = await apiFetch<PagedResult<any>>(businessUrl(`/products/search?${qs}`))
  return { ...data, content: data.content.map(mapProduct) }
}

export async function getProduct(id: string): Promise<ProductDetail> {
  const data = await apiFetch<any>(businessUrl(`/products/${id}`))
  return {
    ...mapProduct(data.productResponse),
    priceHistory: (data.priceHistory ?? []).map(mapPriceHistory),
  }
}

export async function updateProduct(id: string, input: CreateProductInput): Promise<Product> {
  const data = await apiFetch<any>(businessUrl(`/products/${id}`), {
    method: "PUT",
    body: JSON.stringify({
      sku: input.sku,
      name: input.name,
      description: input.description,
      categoryPublicId: input.categoryId || null,
      unitPublicId: input.unitId,
      costPrice: input.costPrice,
      sellingPrice: input.sellingPrice,
      minStockLevel: input.minStockLevel,
      isActive: input.isActive,
    }),
  })
  return mapProduct(data)
}

export async function setProductStatus(id: string, isActive: boolean): Promise<Product> {
  const data = await apiFetch<any>(businessUrl(`/products/${id}/status`), {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  })
  return mapProduct(data)
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch<void>(businessUrl(`/products/${id}`), { method: "DELETE" })
}

export async function getProductBySku(sku: string): Promise<Product> {
  const data = await apiFetch<any>(businessUrl(`/products/sku/${encodeURIComponent(sku)}`))
  return mapProduct(data)
}

function mapProduct(p: any): Product {
  return {
    id: p.publicId,
    sku: p.sku ?? "",
    name: p.name,
    description: p.description ?? "",
    costPrice: Number(p.costPrice),
    sellingPrice: Number(p.sellingPrice),
    minStockLevel: p.minStockLevel ?? 0,
    totalStock: Number(p.totalStock ?? 0),
    categoryId: p.categoryPublicId ?? "",
    categoryName: p.categoryName ?? "",
    unitId: p.unitPublicId ?? "",
    unitName: p.unitName ?? "",
    unitAbbreviation: p.unitAbbreviation ?? "",
    isActive: p.isActive ?? true,
    createdAt: p.createdAt ?? "",
    updatedAt: p.updatedAt ?? "",
  }
}

function mapPriceHistory(h: any): PriceHistory {
  return {
    id: h.id,
    productPublicId: h.productPublicId,
    productName: h.productName,
    oldCostPrice: Number(h.oldCostPrice),
    newCostPrice: Number(h.newCostPrice),
    oldSellingPrice: Number(h.oldSellingPrice),
    newSellingPrice: Number(h.newSellingPrice),
    changedByUsername: h.changedByUsername,
    changedAt: h.changedAt ?? "",
  }
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

export async function getSuppliers(): Promise<Supplier[]> {
  const data = await apiFetch<any[]>(businessUrl("/suppliers"))
  return data.map(mapSupplier)
}

export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  const data = await apiFetch<any>(businessUrl("/suppliers"), {
    method: "POST",
    body: JSON.stringify(input),
  })
  return mapSupplier(data)
}

export async function updateSupplier(id: string, input: CreateSupplierInput): Promise<Supplier> {
  const data = await apiFetch<any>(businessUrl(`/suppliers/${id}`), {
    method: "PUT",
    body: JSON.stringify(input),
  })
  return mapSupplier(data)
}

export async function deleteSupplier(id: string): Promise<void> {
  await apiFetch<void>(businessUrl(`/suppliers/${id}`), { method: "DELETE" })
}

export async function paySupplier(id: string, amount: number, paymentMethod = "CASH"): Promise<Supplier> {
  // storeId: gắn phiếu chi công nợ vào store đang chọn (thiếu → backend fallback store đầu tiên)
  const data = await apiFetch<any>(businessUrl(`/suppliers/${id}/pay`), {
    method: "PUT",
    body: JSON.stringify({ amount, paymentMethod, storeId: getStoreIdOrNull() }),
  })
  return mapSupplier(data)
}

function mapSupplier(s: any): Supplier {
  return {
    id: s.publicId,
    code: s.code ?? "",
    name: s.name,
    phone: s.phone ?? "",
    email: s.email ?? "",
    address: s.address ?? "",
    debtBalance: Number(s.debtBalance ?? 0),
    createdAt: s.createdAt ?? "",
    updatedAt: s.updatedAt ?? "",
  }
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function getCustomers(): Promise<Customer[]> {
  const data = await apiFetch<any[]>(businessUrl("/customers"))
  return data.map(mapCustomer)
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const data = await apiFetch<any>(businessUrl("/customers"), {
    method: "POST",
    body: JSON.stringify(input),
  })
  return mapCustomer(data)
}

export async function updateCustomer(id: string, input: CreateCustomerInput): Promise<Customer> {
  const data = await apiFetch<any>(businessUrl(`/customers/${id}`), {
    method: "PUT",
    body: JSON.stringify(input),
  })
  return mapCustomer(data)
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiFetch<void>(businessUrl(`/customers/${id}`), { method: "DELETE" })
}

export async function payCustomer(id: string, amount: number, paymentMethod = "CASH"): Promise<Customer> {
  // storeId: gắn phiếu thu công nợ vào store đang chọn (thiếu → backend fallback store đầu tiên)
  const data = await apiFetch<any>(businessUrl(`/customers/${id}/pay`), {
    method: "PUT",
    body: JSON.stringify({ amount, paymentMethod, storeId: getStoreIdOrNull() }),
  })
  return mapCustomer(data)
}

function mapCustomer(c: any): Customer {
  return {
    id: c.publicId,
    code: c.code ?? "",
    name: c.name,
    phone: c.phone ?? "",
    email: c.email ?? "",
    address: c.address ?? "",
    debtBalance: Number(c.debtBalance ?? 0),
    createdAt: c.createdAt ?? "",
    updatedAt: c.updatedAt ?? "",
  }
}

// ─── Warehouses ───────────────────────────────────────────────────────────────

export async function getWarehouses(): Promise<Warehouse[]> {
  const data = await apiFetch<any[]>(storeUrl("/warehouses"))
  return data.map((w) => ({
    id: w.publicId,
    name: w.name,
    address: w.address ?? "",
    isActive: w.isActive ?? true,
  }))
}

export async function createWarehouse(input: { name: string; address?: string; isActive: boolean }): Promise<Warehouse> {
  const data = await apiFetch<any>(storeUrl("/warehouses"), {
    method: "POST",
    body: JSON.stringify({ name: input.name, address: input.address || null, isActive: input.isActive }),
  })
  return { id: data.publicId, name: data.name, address: data.address ?? "", isActive: data.isActive ?? true }
}

export async function updateWarehouse(publicId: string, input: { name: string; address?: string; isActive: boolean }): Promise<Warehouse> {
  const data = await apiFetch<any>(storeUrl(`/warehouses/${publicId}`), {
    method: "PUT",
    body: JSON.stringify({ name: input.name, address: input.address || null, isActive: input.isActive }),
  })
  return { id: data.publicId, name: data.name, address: data.address ?? "", isActive: data.isActive ?? true }
}

export async function deleteWarehouse(publicId: string): Promise<void> {
  await apiFetch<void>(storeUrl(`/warehouses/${publicId}`), { method: "DELETE" })
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const data = await apiFetch<any[]>(storeUrl("/inventory"))
  return data.map((i) => ({
    id: i.publicId,
    productPublicId: i.productPublicId,
    productName: i.productName,
    warehousePublicId: i.warehousePublicId,
    warehouseName: i.warehouseName,
    quantity: Number(i.quantity),
    updatedAt: i.updatedAt ?? i.lastModifiedAt ?? "",
  }))
}

export async function adjustInventory(
  productPublicId: string,
  warehousePublicId: string,
  quantity: number,
  note?: string,
): Promise<void> {
  await apiFetch<void>(storeUrl('/inventory/adjust'), {
    method: 'POST',
    body: JSON.stringify({ productPublicId, warehousePublicId, quantity, note: note || null }),
  })
}

export async function transferInventory(
  productPublicId: string,
  fromWarehousePublicId: string,
  toWarehousePublicId: string,
  quantity: number,
  note?: string,
): Promise<void> {
  await apiFetch<void>(storeUrl('/inventory/transfer'), {
    method: 'POST',
    body: JSON.stringify({ productPublicId, fromWarehousePublicId, toWarehousePublicId, quantity, note: note || null }),
  })
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function getOrders(): Promise<Order[]> {
  const data = await apiFetch<{ content: any[] }>(storeUrl('/orders?page=0&size=100'))
  return data.content.map(mapOrder)
}

export async function getOrdersPage(params: {
  page: number
  size: number
  orderCode?: string
  status?: string
  from?: string
  to?: string
  customerPublicId?: string
}): Promise<PagedResult<Order>> {
  const query = new URLSearchParams({ page: String(params.page), size: String(params.size) })
  if (params.orderCode) query.set('orderCode', params.orderCode)
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)
  if (params.customerPublicId) query.set('customerPublicId', params.customerPublicId)
  const data = await apiFetch<any>(storeUrl(`/orders?${query}`))
  return { ...data, content: data.content.map(mapOrder) }
}

export async function getOrder(id: string): Promise<Order> {
  const data = await apiFetch<any>(storeUrl(`/orders/${id}`))
  return mapOrder(data)
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const data = await apiFetch<any>(storeUrl('/orders'), {
    method: 'POST',
    body: JSON.stringify({
      customerPublicId: input.customerPublicId ?? null,
      warehousePublicId: input.warehousePublicId,
      discount: input.discount,
      discountType: input.discountType,
      tax: input.tax,
      paidAmount: input.paidAmount ?? 0,
      paymentMethod: input.paymentMethod ?? 'CASH',
      note: input.note ?? null,
      items: input.items,
    }),
  })
  return mapOrder(data)
}

export async function completeOrder(id: string): Promise<Order> {
  const data = await apiFetch<any>(storeUrl(`/orders/${id}/complete`), { method: 'PUT' })
  return mapOrder(data)
}

export async function cancelOrder(id: string): Promise<Order> {
  const data = await apiFetch<any>(storeUrl(`/orders/${id}/cancel`), { method: 'PUT' })
  return mapOrder(data)
}

export async function payOrder(id: string, amount: number): Promise<Order> {
  const data = await apiFetch<any>(storeUrl(`/orders/${id}/pay`), {
    method: 'PUT',
    body: JSON.stringify({ amount }),
  })
  return mapOrder(data)
}

function mapOrder(o: any): Order {
  return {
    id: o.publicId,
    orderCode: o.orderCode,
    customerPublicId: o.customerPublicId ?? null,
    warehousePublicId: o.warehousePublicId ?? null,
    status: o.status,
    subtotal: Number(o.subtotal ?? 0),
    discount: Number(o.discount ?? 0),
    discountType: o.discountType ?? 'FIXED',
    tax: Number(o.tax ?? 0),
    totalAmount: Number(o.totalAmount ?? 0),
    paidAmount: Number(o.paidAmount ?? 0),
    debtAmount: Number(o.debtAmount ?? 0),
    note: o.note ?? '',
    createdAt: o.createdAt ?? '',
    items: (o.items ?? []).map((item: any) => ({
      id: item.publicId ?? item.id,
      productPublicId: item.productPublicId,
      productName: item.productName,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount ?? 0),
      discountType: item.discountType ?? 'FIXED',
      totalPrice: Number(item.totalPrice),
    })),
  }
}

// ─── Purchase Orders ──────────────────────────────────────────────────────────

export async function getPurchaseOrdersPage(params: {
  page?: number
  size?: number
  orderCode?: string
  status?: string
  from?: string
  to?: string
  supplierPublicId?: string
}): Promise<PagedResult<PurchaseOrder>> {
  const query = new URLSearchParams()
  if (params.page !== undefined) query.set('page', String(params.page))
  if (params.size !== undefined) query.set('size', String(params.size))
  if (params.orderCode) query.set('orderCode', params.orderCode)
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)
  if (params.supplierPublicId) query.set('supplierPublicId', params.supplierPublicId)
  const qs = query.toString()
  const data = await apiFetch<any>(storeUrl(`/purchases${qs ? `?${qs}` : ''}`))
  return {
    content: data.content.map(mapPurchaseOrder),
    page: data.page,
    size: data.size,
    totalElements: data.totalElements,
    totalPages: data.totalPages,
  }
}

export async function getPurchaseOrder(id: string): Promise<PurchaseOrder> {
  const data = await apiFetch<any>(storeUrl(`/purchases/${id}`))
  return mapPurchaseOrder(data)
}

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  const data = await apiFetch<any[]>(storeUrl("/purchases"))
  return data.map(mapPurchaseOrder)
}

export async function createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
  const data = await apiFetch<any>(storeUrl("/purchases"), {
    method: "POST",
    body: JSON.stringify({
      supplierPublicId: input.supplierPublicId,
      warehousePublicId: input.warehousePublicId,
      paidAmount: input.paidAmount ?? 0,
      paymentMethod: input.paymentMethod ?? 'CASH',
      note: input.note ?? null,
      items: input.items,
    }),
  })
  return mapPurchaseOrder(data)
}

export async function payPurchaseOrder(id: string, amount: number): Promise<PurchaseOrder> {
  const data = await apiFetch<any>(storeUrl(`/purchases/${id}/pay`), {
    method: 'PUT',
    body: JSON.stringify({ amount }),
  })
  return mapPurchaseOrder(data)
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  await apiFetch<void>(storeUrl(`/purchases/${id}/cancel`), { method: "PUT" })
}

export async function updatePurchaseOrder(id: string, input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
  const data = await apiFetch<any>(storeUrl(`/purchases/${id}`), {
    method: 'PUT',
    body: JSON.stringify({
      supplierPublicId: input.supplierPublicId,
      warehousePublicId: input.warehousePublicId,
      paidAmount: input.paidAmount ?? 0,
      paymentMethod: input.paymentMethod ?? 'CASH',
      note: input.note ?? null,
      items: input.items,
    }),
  })
  return mapPurchaseOrder(data)
}

export async function updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus): Promise<void> {
  if (status === PurchaseOrderStatus.RECEIVED) {
    await apiFetch<void>(storeUrl(`/purchases/${id}/receive`), { method: "PUT" })
  } else if (status === PurchaseOrderStatus.CANCELLED) {
    await apiFetch<void>(storeUrl(`/purchases/${id}/cancel`), { method: "PUT" })
  }
}

function mapPurchaseOrder(p: any): PurchaseOrder {
  return {
    id: p.publicId,
    orderCode: p.orderCode,
    supplierPublicId: p.supplierPublicId,
    supplierName: p.supplierName ?? '',
    warehousePublicId: p.warehousePublicId ?? '',
    warehouseName: p.warehouseName ?? '',
    status: p.status as PurchaseOrderStatus,
    totalAmount: Number(p.totalAmount ?? 0),
    paidAmount: Number(p.paidAmount ?? 0),
    debtAmount: Number(p.debtAmount ?? 0),
    note: p.note ?? "",
    createdAt: p.createdAt ?? "",
    items: (p.items ?? []).map((item: any) => ({
      productPublicId: item.productPublicId,
      productName: item.productName,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
  }
}

// ─── Return Orders ────────────────────────────────────────────────────────────

export async function getReturnOrders(): Promise<ReturnOrder[]> {
  const data = await apiFetch<any[]>(storeUrl('/returns'))
  return data.map(mapReturnOrder)
}

export async function getReturnOrder(id: string): Promise<ReturnOrder> {
  const data = await apiFetch<any>(storeUrl(`/returns/${id}`))
  return mapReturnOrder(data)
}

export async function createReturnOrder(input: CreateReturnOrderInput): Promise<ReturnOrder> {
  const data = await apiFetch<any>(storeUrl('/returns'), {
    method: 'POST',
    body: JSON.stringify({
      returnCode: input.returnCode ?? null,
      originalOrderPublicId: input.originalOrderPublicId ?? null,
      warehousePublicId: input.warehousePublicId,
      reason: input.reason,
      refundMethod: input.refundMethod,
      note: input.note ?? null,
      items: input.items,
    }),
  })
  return mapReturnOrder(data)
}

export async function completeReturnOrder(id: string): Promise<ReturnOrder> {
  const data = await apiFetch<any>(storeUrl(`/returns/${id}/complete`), { method: 'PUT' })
  return mapReturnOrder(data)
}

export async function cancelReturnOrder(id: string): Promise<ReturnOrder> {
  const data = await apiFetch<any>(storeUrl(`/returns/${id}/cancel`), { method: 'PUT' })
  return mapReturnOrder(data)
}

function mapReturnOrder(r: any): ReturnOrder {
  return {
    id: r.publicId,
    returnCode: r.returnCode,
    originalOrderPublicId: r.originalOrderPublicId ?? null,
    warehousePublicId: r.warehousePublicId ?? null,
    status: r.status,
    reason: r.reason ?? '',
    totalRefund: Number(r.totalRefund ?? 0),
    refundMethod: r.refundMethod,
    note: r.note ?? '',
    createdAt: r.createdAt ?? '',
    items: (r.items ?? []).map((item: any) => ({
      productPublicId: item.productPublicId,
      productName: item.productName,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
  }
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export type PaymentPageResult = {
  content: Payment[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  totalIncome: number
  totalExpense: number
}

export async function getPaymentsPage(params: {
  page?: number
  size?: number
  direction?: string
  method?: string
  from?: string
  to?: string
}): Promise<PaymentPageResult> {
  const query = new URLSearchParams()
  if (params.page !== undefined) query.set('page', String(params.page))
  if (params.size !== undefined) query.set('size', String(params.size))
  if (params.direction && params.direction !== 'all') query.set('direction', params.direction)
  if (params.method && params.method !== 'all') query.set('method', params.method)
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)
  const qs = query.toString()
  const data = await apiFetch<any>(storeUrl(`/payments${qs ? `?${qs}` : ''}`))
  return {
    content: (data.content ?? []).map(mapPayment),
    page: data.page,
    size: data.size,
    totalElements: data.totalElements,
    totalPages: data.totalPages,
    totalIncome: Number(data.totalIncome ?? 0),
    totalExpense: Number(data.totalExpense ?? 0),
  }
}

function mapPayment(p: any): Payment {
  return {
    id: p.publicId,
    customerPublicId: p.customerPublicId ?? null,
    supplierPublicId: p.supplierPublicId ?? null,
    amount: Number(p.amount),
    paymentMethod: p.paymentMethod,
    note: p.note ?? "",
    createdAt: p.createdAt ?? "",
  }
}

export async function deletePayment(publicId: string): Promise<void> {
  await apiFetch<void>(storeUrl(`/payments/${publicId}`), { method: 'DELETE' })
}

export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  const data = await apiFetch<any>(storeUrl('/payments'), {
    method: 'POST',
    body: JSON.stringify({
      customerPublicId: input.customerPublicId ?? null,
      supplierPublicId: input.supplierPublicId ?? null,
      paidAmount: input.paidAmount,
      paymentMethod: input.paymentMethod,
      note: input.note ?? null,
    }),
  })
  return mapPayment(data)
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationSummary = { lowStockCount: number; pendingInvoiceCount: number }
export type LowStockItem = { productName: string; sku: string; quantity: number; minStockLevel: number; warehouseName: string }

export async function getNotificationSummary(): Promise<NotificationSummary> {
  return apiFetch<NotificationSummary>(storeUrl('/notifications/summary'))
}

export async function getLowStockNotifications(): Promise<LowStockItem[]> {
  const data = await apiFetch<any[]>(storeUrl('/notifications/low-stock'))
  return data.map((i) => ({
    productName: i.productName,
    sku: i.sku,
    quantity: Number(i.quantity),
    minStockLevel: i.minStockLevel,
    warehouseName: i.warehouseName,
  }))
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboard(): Promise<DashboardData> {
  const raw = await apiFetch<any>(storeUrl('/dashboard'))
  return {
    kpi: {
      revenueThisMonth: Number(raw.kpi.revenueThisMonth),
      revenueLastMonth: Number(raw.kpi.revenueLastMonth),
      collectedThisMonth: Number(raw.kpi.collectedThisMonth),
      collectedLastMonth: Number(raw.kpi.collectedLastMonth),
      ordersThisMonth: raw.kpi.ordersThisMonth,
      ordersLastMonth: raw.kpi.ordersLastMonth,
      totalCustomers: raw.kpi.totalCustomers,
    },
    salesChart: (raw.salesChart ?? []).map((m: any) => ({
      month: m.month,
      revenue: Number(m.revenue),
      orderCount: m.orderCount,
    })),
    lowStockProducts: (raw.lowStockProducts ?? []).map((p: any) => ({
      productName: p.productName,
      sku: p.sku,
      totalStock: p.totalStock,
      minStockLevel: p.minStockLevel,
    })),
    recentOrders: (raw.recentOrders ?? []).map((o: any) => ({
      orderCode: o.orderCode,
      customerName: o.customerName,
      totalAmount: Number(o.totalAmount),
      status: o.status,
      createdAt: o.createdAt,
    })),
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function adminGetUsers(params: {
  q?: string
  page?: number
  size?: number
}): Promise<PagedResult<AdminUser>> {
  const qs = new URLSearchParams({ page: String(params.page ?? 0), size: String(params.size ?? 20) })
  if (params.q) qs.set('q', params.q)
  const data = await adminApiFetch<any>(`/api/admin/users?${qs}`)
  return {
    ...data,
    content: data.content.map((u: any): AdminUser => ({
      id: u.id,
      username: u.username,
      email: u.email,
      fullName: u.fullName ?? '',
      phone: u.phone ?? null,
      isActive: u.isActive ?? true,
      createdAt: u.createdAt ?? '',
      deletedAt: u.deletedAt ?? null,
    })),
  }
}

export async function adminSetUserStatus(userId: number, isActive: boolean): Promise<AdminUser> {
  const u = await adminApiFetch<any>(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  })
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    fullName: u.fullName ?? '',
    phone: u.phone ?? null,
    isActive: u.isActive ?? true,
    createdAt: u.createdAt ?? '',
    deletedAt: u.deletedAt ?? null,
  }
}

export async function adminDeleteUser(userId: number): Promise<void> {
  await adminApiFetch<void>(`/api/admin/users/${userId}`, { method: 'DELETE' })
}

export async function adminGetStats(): Promise<AdminStats> {
  const data = await adminApiFetch<any>('/api/admin/subscriptions/stats')
  return {
    totalBusinesses: data.totalBusinesses,
    totalUsers: data.totalUsers,
    activeUsers: data.activeUsers,
    pendingInvoices: data.pendingInvoices,
    freePlan: data.freePlan,
    basicPlan: data.basicPlan,
    proPlan: data.proPlan,
    activeSubscriptions: data.activeSubscriptions,
    expiredSubscriptions: data.expiredSubscriptions,
    revenueThisMonth: Number(data.revenueThisMonth),
    revenueLast6Months: (data.revenueLast6Months ?? []).map((m: any) => ({
      month: m.month,
      amount: Number(m.amount),
    })),
  }
}
