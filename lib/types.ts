export interface PagedResult<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

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

export interface StoreInfo {
  storeId: number
  storeName: string
  role: string
  positionTitle: string | null
}

export interface BusinessMembership {
  businessId: number
  businessName: string
  stores: StoreInfo[]
}

export interface LoginInput {
  usernameOrEmail: string
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
  memberships: BusinessMembership[]
  refreshToken?: string
}

// ─── Business ────────────────────────────────────────────────────────────────

export interface Business {
  id: number
  name: string
  address: string | null
  phone: string | null
  email: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface BusinessSubscription {
  id: number
  businessId: number
  plan: 'FREE' | 'BASIC' | 'PRO'
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  billingCycle: string | null
  maxStores: number | null
  maxStaff: number | null
  maxProducts: number | null
  maxWarehouses: number | null
  startedAt: string
  expiresAt: string | null
  createdAt: string
  updatedAt: string
  pendingPlan: 'FREE' | 'BASIC' | 'PRO' | null
  pendingBillingCycle: string | null
}

export interface UpdateBusinessInput {
  name: string
  address?: string
  phone?: string
  email?: string
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string   // publicId
  name: string
  description: string
}

export interface CreateCategoryInput {
  name: string
  description?: string
}

export interface Unit {
  id: string   // publicId
  name: string
  abbreviation: string
}

export interface CreateUnitInput {
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
  categoryName: string
  unitId: string
  unitName: string
  unitAbbreviation: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PriceHistory {
  id: number
  productPublicId: string
  productName: string
  oldCostPrice: number
  newCostPrice: number
  oldSellingPrice: number
  newSellingPrice: number
  changedByUsername: string
  changedAt: string
}

export interface ProductDetail extends Product {
  priceHistory: PriceHistory[]
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
  code: string
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
  discount: number
  discountType: string
  totalPrice: number
}

export interface Order {
  id: string   // publicId
  orderCode: string
  customerPublicId: string | null
  warehousePublicId: string | null
  status: string
  subtotal: number
  discount: number
  discountType: string
  tax: number
  totalAmount: number
  paidAmount: number
  debtAmount: number
  note: string
  createdAt: string
  items: OrderItem[]
}

export interface CreateOrderItemInput {
  productPublicId: string
  quantity: number
  unitPrice: number
  discount: number
  discountType: 'FIXED' | 'PERCENT'
}

export interface CreateOrderInput {
  customerPublicId?: string
  warehousePublicId: string
  discount: number
  discountType: 'FIXED' | 'PERCENT'
  tax: number
  paidAmount?: number
  paymentMethod?: string
  note?: string
  items: CreateOrderItemInput[]
}

// ─── Purchase Orders ──────────────────────────────────────────────────────────

export enum PurchaseOrderStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

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
  supplierName: string
  warehousePublicId: string
  warehouseName: string
  status: PurchaseOrderStatus
  totalAmount: number
  paidAmount: number
  debtAmount: number
  note: string
  createdAt: string
  items: PurchaseOrderItem[]
}

export interface CreatePurchaseOrderInput {
  supplierPublicId: string
  warehousePublicId: string
  paidAmount?: number
  paymentMethod?: string
  note?: string
  items: { productPublicId: string; quantity: number; unitPrice: number }[]
}

// ─── Subscription Invoices ────────────────────────────────────────────────────

export interface SubscriptionInvoice {
  id: number
  businessId: number
  plan: 'FREE' | 'BASIC' | 'PRO'
  billingCycle: 'MONTHLY' | 'YEARLY'
  amount: number
  status: 'PENDING' | 'PAID' | 'FAILED'
  bankTransferRef: string | null
  adminNote: string | null
  periodStart: string
  periodEnd: string
  paidAt: string | null
  confirmedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface BankTransferInfo {
  bankName: string
  accountNumber: string
  accountHolder: string
  branch: string
}

export interface UpgradeResponse {
  invoice: SubscriptionInvoice
  bankInfo: BankTransferInfo
}

// ─── Return Orders ────────────────────────────────────────────────────────────

export interface ReturnOrderItem {
  productPublicId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface ReturnOrder {
  id: string   // publicId
  returnCode: string
  originalOrderPublicId: string | null
  warehousePublicId: string | null
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  reason: string
  totalRefund: number
  refundMethod: 'CASH' | 'BANK_TRANSFER' | 'STORE_CREDIT'
  note: string
  createdAt: string
  items: ReturnOrderItem[]
}

export interface CreateReturnOrderItemInput {
  productPublicId: string
  quantity: number
  unitPrice: number
}

export interface CreateReturnOrderInput {
  returnCode?: string
  originalOrderPublicId?: string
  warehousePublicId: string
  reason: string
  refundMethod: 'CASH' | 'BANK_TRANSFER' | 'STORE_CREDIT'
  note?: string
  items: CreateReturnOrderItemInput[]
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

export interface CreatePaymentInput {
  customerPublicId?: string
  supplierPublicId?: string
  paidAmount: number
  paymentMethod: string
  note?: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardKpi {
  revenueThisMonth: number
  revenueLastMonth: number
  collectedThisMonth: number
  collectedLastMonth: number
  ordersThisMonth: number
  ordersLastMonth: number
  totalCustomers: number
}

export interface DashboardSalesMonth {
  month: string     // "YYYY-MM"
  revenue: number
  orderCount: number
}

export interface DashboardLowStockProduct {
  productName: string
  sku: string
  totalStock: number
  minStockLevel: number
}

export interface DashboardRecentOrder {
  orderCode: string
  customerName: string
  totalAmount: number
  status: string
  createdAt: string
}

export interface DashboardData {
  kpi: DashboardKpi
  salesChart: DashboardSalesMonth[]
  lowStockProducts: DashboardLowStockProduct[]
  recentOrders: DashboardRecentOrder[]
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: number
  username: string
  email: string
  fullName: string
  phone: string | null
  isActive: boolean
  createdAt: string
  deletedAt: string | null
}

export interface AdminMonthlyRevenue {
  month: string
  amount: number
}

export interface AdminStats {
  totalBusinesses: number
  totalUsers: number
  activeUsers: number
  pendingInvoices: number
  freePlan: number
  basicPlan: number
  proPlan: number
  activeSubscriptions: number
  expiredSubscriptions: number
  revenueThisMonth: number
  revenueLast6Months: AdminMonthlyRevenue[]
}
