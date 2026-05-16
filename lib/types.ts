// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number
  publicId: string
  username: string
  email: string
  fullName: string
  phone: string | null
  isActive: boolean
}

export interface StoreMembership {
  id: number
  storeId: number
  role: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  username: string
  email: string
  password: string
  fullName: string
  phone?: string
}

export interface AuthResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: AuthUser
  storeMemberships: StoreMembership[]
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string   // publicId
  name: string
  description: string
}

export interface Unit {
  id: string   // publicId
  name: string
  abbreviation: string
}

export interface Product {
  id: string   // publicId
  sku: string
  name: string
  description: string
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

export interface CreateProductInput {
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

export interface UpdateProductInput extends CreateProductInput {
  id: string
}

// ─── Partners ─────────────────────────────────────────────────────────────────

export interface Supplier {
  id: string   // publicId
  code: string
  name: string
  phone: string
  email: string
  address: string
  debtBalance: number
  createdAt: string
  updatedAt: string
}

export interface CreateSupplierInput {
  code?: string
  name: string
  phone: string
  email: string
  address?: string
}

export interface UpdateSupplierInput extends CreateSupplierInput {
  id: string
}

export interface Customer {
  id: string   // publicId
  code: string
  name: string
  phone: string
  email: string
  address: string
  debtBalance: number
  createdAt: string
  updatedAt: string
}

export interface CreateCustomerInput {
  code?: string
  name: string
  phone: string
  email: string
  address?: string
}

// ─── Warehouse ────────────────────────────────────────────────────────────────

export interface Warehouse {
  id: string   // publicId
  name: string
  address: string
  isActive: boolean
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string   // publicId
  productPublicId: string
  productName: string
  warehousePublicId: string
  warehouseName: string
  quantity: number
  updatedAt: string
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string
  productPublicId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Order {
  id: string   // publicId
  orderCode: string
  customerPublicId: string | null
  status: string
  subtotal: number
  discount: number
  tax: number
  totalAmount: number
  paidAmount: number
  debtAmount: number
  note: string
  createdAt: string
  items: OrderItem[]
}

// ─── Purchase Orders ──────────────────────────────────────────────────────────

export interface PurchaseOrderItem {
  productPublicId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface PurchaseOrder {
  id: string   // publicId
  orderCode: string
  supplierPublicId: string
  status: string
  totalAmount: number
  paidAmount: number
  debtAmount: number
  note: string
  createdAt: string
  items: PurchaseOrderItem[]
}

export interface CreatePurchaseOrderInput {
  orderCode?: string
  supplierPublicId: string
  warehousePublicId: string
  note?: string
  items: { productPublicId: string; quantity: number; unitPrice: number }[]
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export interface Payment {
  id: string   // publicId
  customerPublicId: string | null
  supplierPublicId: string | null
  amount: number
  paymentMethod: string
  note: string
  createdAt: string
}
