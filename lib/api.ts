import type {
  Category, Unit, Product, CreateProductInput,
  Supplier, CreateSupplierInput,
  Customer, CreateCustomerInput,
  Warehouse,
  InventoryItem,
  Order,
  PurchaseOrder, CreatePurchaseOrderInput,
  Payment,
  LoginInput, RegisterInput, AuthResponse,
} from "./types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  const body = await res.json()
  if (!res.ok || !body.success) {
    throw new Error(body.error?.message || "Request failed")
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
  const data = await apiFetch<any[]>(storeUrl("/categories"))
  return data.map((c) => ({ id: c.publicId, name: c.name, description: c.description ?? "" }))
}

// ─── Units ────────────────────────────────────────────────────────────────────

export async function getUnits(): Promise<Unit[]> {
  const data = await apiFetch<any[]>(storeUrl("/units"))
  return data.map((u) => ({ id: u.publicId, name: u.name, abbreviation: u.abbreviation }))
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  const data = await apiFetch<any[]>(storeUrl("/products"))
  return data.map(mapProduct)
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const data = await apiFetch<any>(storeUrl("/products"), {
    method: "POST",
    body: JSON.stringify(input),
  })
  return mapProduct(data)
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch<void>(storeUrl(`/products/${id}`), { method: "DELETE" })
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
    categoryId: p.categoryId ? String(p.categoryId) : "",
    unitId: p.unitId ? String(p.unitId) : "",
    isActive: p.isActive ?? true,
    createdAt: p.createdAt ?? "",
    updatedAt: p.updatedAt ?? "",
  }
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

export async function getSuppliers(): Promise<Supplier[]> {
  const data = await apiFetch<any[]>(storeUrl("/suppliers"))
  return data.map(mapSupplier)
}

export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  const data = await apiFetch<any>(storeUrl("/suppliers"), {
    method: "POST",
    body: JSON.stringify(input),
  })
  return mapSupplier(data)
}

export async function deleteSupplier(id: string): Promise<void> {
  await apiFetch<void>(storeUrl(`/suppliers/${id}`), { method: "DELETE" })
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
  const data = await apiFetch<any[]>(storeUrl("/customers"))
  return data.map(mapCustomer)
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const data = await apiFetch<any>(storeUrl("/customers"), {
    method: "POST",
    body: JSON.stringify(input),
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

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function getOrders(): Promise<Order[]> {
  const data = await apiFetch<any[]>(storeUrl("/orders"))
  return data.map(mapOrder)
}

function mapOrder(o: any): Order {
  return {
    id: o.publicId,
    orderCode: o.orderCode,
    customerPublicId: o.customerPublicId ?? null,
    status: o.status,
    subtotal: Number(o.subtotal ?? 0),
    discount: Number(o.discount ?? 0),
    tax: Number(o.tax ?? 0),
    totalAmount: Number(o.totalAmount ?? 0),
    paidAmount: Number(o.paidAmount ?? 0),
    debtAmount: Number(o.debtAmount ?? 0),
    note: o.note ?? "",
    createdAt: o.createdAt ?? "",
    items: (o.items ?? []).map((item: any) => ({
      id: item.publicId ?? item.id,
      productPublicId: item.productPublicId,
      productName: item.productName,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
  }
}

// ─── Purchase Orders ──────────────────────────────────────────────────────────

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  const data = await apiFetch<any[]>(storeUrl("/purchases"))
  return data.map(mapPurchaseOrder)
}

export async function createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
  const data = await apiFetch<any>(storeUrl("/purchases"), {
    method: "POST",
    body: JSON.stringify(input),
  })
  return mapPurchaseOrder(data)
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  await apiFetch<void>(storeUrl(`/purchases/${id}/cancel`), { method: "PUT" })
}

export async function updatePurchaseOrderStatus(id: string, status: string): Promise<void> {
  if (status === "received" || status === "completed") {
    await apiFetch<void>(storeUrl(`/purchases/${id}/receive`), { method: "PUT" })
  }
}

function mapPurchaseOrder(p: any): PurchaseOrder {
  return {
    id: p.publicId,
    orderCode: p.orderCode,
    supplierPublicId: p.supplierPublicId,
    status: p.status,
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

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function getPayments(): Promise<Payment[]> {
  const data = await apiFetch<any[]>(storeUrl("/payments"))
  return data.map((p) => ({
    id: p.publicId,
    customerPublicId: p.customerPublicId ?? null,
    supplierPublicId: p.supplierPublicId ?? null,
    amount: Number(p.amount),
    paymentMethod: p.paymentMethod,
    note: p.note ?? "",
    createdAt: p.createdAt ?? "",
  }))
}
