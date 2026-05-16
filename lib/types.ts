export interface Category {
  id: string
  name: string
  description: string
}

export interface Unit {
  id: string
  name: string
  abbreviation: string
}

export interface Product {
  id: string
  name: string
  description: string
  costPrice: number
  sellingPrice: number
  minimumStock: number
  currentStock: number
  categoryId: string
  unitId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProductInput {
  name: string
  description: string
  costPrice: number
  sellingPrice: number
  minimumStock: number
  categoryId: string
  unitId: string
  isActive: boolean
}

export interface UpdateProductInput extends CreateProductInput {
  id: string
}

export interface Supplier {
  id: string
  name: string
  address: string
  city: string
  phone: string
  email: string
  contactPerson: string
  paymentTerms: string
  totalInvoiceValue: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSupplierInput {
  name: string
  address: string
  city: string
  phone: string
  email: string
  contactPerson: string
  paymentTerms: string
  isActive: boolean
}

export interface UpdateSupplierInput extends CreateSupplierInput {
  id: string
}

export interface PurchaseOrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  supplierName: string
  orderDate: string
  expectedDeliveryDate: string
  status: "pending" | "received" | "completed"
  totalAmount: number
  notes: string
  items: PurchaseOrderItem[]
  createdAt: string
  updatedAt: string
}

export interface CreatePurchaseOrderInput {
  supplierId: string
  orderDate: string
  expectedDeliveryDate: string
  status: "pending" | "received" | "completed"
  notes: string
  items: Omit<PurchaseOrderItem, "id">[]
}

export interface UpdatePurchaseOrderInput extends CreatePurchaseOrderInput {
  id: string
}

export interface InventoryItem {
  id: string
  productName: string
  sku: string
  warehouse: string
  quantity: number
  unit: string
  minStock: number
  maxStock: number
  lastUpdated: string
}

export interface CustomerOrder {
  id: string
  date: string
  total: number
  status: "completed" | "pending" | "cancelled"
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  debtBalance: number
  totalSpent: number
  orderCount: number
  status: "active" | "inactive"
  joinedDate: string
  lastOrderDate: string
  recentOrders: CustomerOrder[]
}

export interface OrderItem {
  name: string
  sku: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  customer: string
  email: string
  phone: string
  status: "pending" | "processing" | "shipped" | "completed" | "cancelled"
  total: number
  subtotal: number
  shipping: number
  tax: number
  date: string
  shippingAddress: string
  items: OrderItem[]
}

export interface Payment {
  id: string
  type: "income" | "expense"
  amount: number
  category: string
  description: string
  contactName: string
  contactType: "customer" | "supplier"
  date: string
  reference: string
  method: "cash" | "bank_transfer" | "credit_card" | "check"
}
