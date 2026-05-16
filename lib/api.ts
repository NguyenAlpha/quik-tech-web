import { Category, Unit, Product, CreateProductInput, UpdateProductInput, Supplier, CreateSupplierInput, UpdateSupplierInput, PurchaseOrder, CreatePurchaseOrderInput, UpdatePurchaseOrderInput, InventoryItem, Customer, Order, Payment } from "./types"

// Mock data
const categories: Category[] = [
  { id: "cat-1", name: "Electronics", description: "Electronic devices and accessories" },
  { id: "cat-2", name: "Office Supplies", description: "Office and stationery items" },
  { id: "cat-3", name: "Furniture", description: "Office furniture" },
  { id: "cat-4", name: "Consumables", description: "Consumable items" },
  { id: "cat-5", name: "Tools", description: "Tools and equipment" },
]

const units: Unit[] = [
  { id: "unit-1", name: "Piece", abbreviation: "pcs" },
  { id: "unit-2", name: "Box", abbreviation: "box" },
  { id: "unit-3", name: "Kilogram", abbreviation: "kg" },
  { id: "unit-4", name: "Meter", abbreviation: "m" },
  { id: "unit-5", name: "Liter", abbreviation: "L" },
]

let products: Product[] = [
  {
    id: "prod-1",
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse with 2.4GHz connection",
    costPrice: 8.5,
    sellingPrice: 15.99,
    minimumStock: 20,
    currentStock: 45,
    categoryId: "cat-1",
    unitId: "unit-1",
    isActive: true,
    createdAt: "2024-01-10",
    updatedAt: "2024-01-10",
  },
  {
    id: "prod-2",
    name: "USB-C Hub",
    description: "7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader",
    costPrice: 12.5,
    sellingPrice: 24.99,
    minimumStock: 15,
    currentStock: 8,
    categoryId: "cat-1",
    unitId: "unit-1",
    isActive: true,
    createdAt: "2024-01-12",
    updatedAt: "2024-01-12",
  },
  {
    id: "prod-3",
    name: "A4 Paper Ream",
    description: "500 sheets of 80gsm white paper",
    costPrice: 3.0,
    sellingPrice: 5.49,
    minimumStock: 50,
    currentStock: 120,
    categoryId: "cat-2",
    unitId: "unit-2",
    isActive: true,
    createdAt: "2024-01-11",
    updatedAt: "2024-01-11",
  },
]

// API functions
export async function getCategories(): Promise<Category[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(categories), 300)
  })
}

export async function getUnits(): Promise<Unit[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(units), 300)
  })
}

export async function getProducts(): Promise<Product[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(products), 500)
  })
}

export async function getProductById(id: string): Promise<Product | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const product = products.find((p) => p.id === id)
      resolve(product || null)
    }, 300)
  })
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        ...input,
        currentStock: 0,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      }
      products.push(newProduct)
      resolve(newProduct)
    }, 500)
  })
}

export async function updateProduct(input: UpdateProductInput): Promise<Product> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = products.findIndex((p) => p.id === input.id)
      if (index === -1) {
        reject(new Error("Product not found"))
        return
      }
      const updatedProduct: Product = {
        ...products[index],
        ...input,
        updatedAt: new Date().toISOString().split("T")[0],
      }
      products[index] = updatedProduct
      resolve(updatedProduct)
    }, 500)
  })
}

export async function deleteProduct(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = products.findIndex((p) => p.id === id)
      if (index === -1) {
        reject(new Error("Product not found"))
        return
      }
      products.splice(index, 1)
      resolve()
    }, 300)
  })
}

// Suppliers mock data
let suppliers: Supplier[] = [
  {
    id: "supp-1",
    name: "Tech Distributors Inc.",
    address: "123 Tech Park Avenue",
    city: "Ho Chi Minh City",
    phone: "+84 28 1234 5678",
    email: "sales@techdistrib.vn",
    contactPerson: "Nguyen Van A",
    paymentTerms: "Net 30",
    totalInvoiceValue: 45000,
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "supp-2",
    name: "Office Solutions Ltd.",
    address: "456 Business Street",
    city: "Hanoi",
    phone: "+84 24 5678 9012",
    email: "contact@officesol.vn",
    contactPerson: "Tran Thi B",
    paymentTerms: "Net 45",
    totalInvoiceValue: 32500,
    isActive: true,
    createdAt: "2024-01-02",
    updatedAt: "2024-01-02",
  },
  {
    id: "supp-3",
    name: "Global Imports Co.",
    address: "789 International Boulevard",
    city: "Da Nang",
    phone: "+84 236 123 4567",
    email: "orders@globalimports.com",
    contactPerson: "Le Van C",
    paymentTerms: "Net 60",
    totalInvoiceValue: 78900,
    isActive: true,
    createdAt: "2024-01-03",
    updatedAt: "2024-01-03",
  },
]

// Purchase Orders mock data
let purchaseOrders: PurchaseOrder[] = [
  {
    id: "po-1",
    poNumber: "PO-2024-001",
    supplierId: "supp-1",
    supplierName: "Tech Distributors Inc.",
    orderDate: "2024-01-15",
    expectedDeliveryDate: "2024-01-25",
    status: "pending",
    totalAmount: 5400,
    notes: "Standard order for Q1",
    items: [
      { id: "poi-1", productId: "prod-1", productName: "Wireless Mouse", quantity: 100, unitPrice: 8.5, totalPrice: 850 },
      { id: "poi-2", productId: "prod-2", productName: "USB-C Hub", quantity: 200, unitPrice: 12.5, totalPrice: 2500 },
      { id: "poi-3", productId: "prod-3", productName: "A4 Paper Ream", quantity: 40, unitPrice: 3.0, totalPrice: 120 },
    ],
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: "po-2",
    poNumber: "PO-2024-002",
    supplierId: "supp-2",
    supplierName: "Office Solutions Ltd.",
    orderDate: "2024-01-10",
    expectedDeliveryDate: "2024-01-20",
    status: "received",
    totalAmount: 3250,
    notes: "Urgent office supplies",
    items: [
      { id: "poi-4", productId: "prod-3", productName: "A4 Paper Ream", quantity: 100, unitPrice: 3.0, totalPrice: 300 },
    ],
    createdAt: "2024-01-10",
    updatedAt: "2024-01-12",
  },
  {
    id: "po-3",
    poNumber: "PO-2024-003",
    supplierId: "supp-3",
    supplierName: "Global Imports Co.",
    orderDate: "2024-01-05",
    expectedDeliveryDate: "2024-01-15",
    status: "completed",
    totalAmount: 7890,
    notes: "International shipment completed",
    items: [
      { id: "poi-5", productId: "prod-1", productName: "Wireless Mouse", quantity: 500, unitPrice: 8.5, totalPrice: 4250 },
      { id: "poi-6", productId: "prod-2", productName: "USB-C Hub", quantity: 300, unitPrice: 12.5, totalPrice: 3750 },
    ],
    createdAt: "2024-01-05",
    updatedAt: "2024-01-15",
  },
]

// Supplier API functions
export async function getSuppliers(): Promise<Supplier[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(suppliers), 500)
  })
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const supplier = suppliers.find((s) => s.id === id)
      resolve(supplier || null)
    }, 300)
  })
}

export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newSupplier: Supplier = {
        id: `supp-${Date.now()}`,
        ...input,
        totalInvoiceValue: 0,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      }
      suppliers.push(newSupplier)
      resolve(newSupplier)
    }, 500)
  })
}

export async function updateSupplier(input: UpdateSupplierInput): Promise<Supplier> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = suppliers.findIndex((s) => s.id === input.id)
      if (index === -1) {
        reject(new Error("Supplier not found"))
        return
      }
      const updatedSupplier: Supplier = {
        ...suppliers[index],
        ...input,
        updatedAt: new Date().toISOString().split("T")[0],
      }
      suppliers[index] = updatedSupplier
      resolve(updatedSupplier)
    }, 500)
  })
}

export async function deleteSupplier(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = suppliers.findIndex((s) => s.id === id)
      if (index === -1) {
        reject(new Error("Supplier not found"))
        return
      }
      suppliers.splice(index, 1)
      resolve()
    }, 300)
  })
}

// Purchase Order API functions
export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(purchaseOrders), 500)
  })
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const po = purchaseOrders.find((p) => p.id === id)
      resolve(po || null)
    }, 300)
  })
}

export async function createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const supplier = suppliers.find((s) => s.id === input.supplierId)
      if (!supplier) throw new Error("Supplier not found")

      const totalAmount = input.items.reduce((sum, item) => sum + item.totalPrice, 0)
      const poNumber = `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 1).padStart(3, "0")}`

      const newPO: PurchaseOrder = {
        id: `po-${Date.now()}`,
        poNumber,
        supplierId: input.supplierId,
        supplierName: supplier.name,
        orderDate: input.orderDate,
        expectedDeliveryDate: input.expectedDeliveryDate,
        status: input.status,
        totalAmount,
        notes: input.notes,
        items: input.items.map((item, idx) => ({ ...item, id: `poi-${Date.now()}-${idx}` })),
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      }
      purchaseOrders.push(newPO)
      resolve(newPO)
    }, 500)
  })
}

export async function updatePurchaseOrderStatus(id: string, status: "pending" | "received" | "completed"): Promise<PurchaseOrder> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = purchaseOrders.findIndex((p) => p.id === id)
      if (index === -1) {
        reject(new Error("Purchase order not found"))
        return
      }
      purchaseOrders[index].status = status
      purchaseOrders[index].updatedAt = new Date().toISOString().split("T")[0]
      resolve(purchaseOrders[index])
    }, 300)
  })
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = purchaseOrders.findIndex((p) => p.id === id)
      if (index === -1) {
        reject(new Error("Purchase order not found"))
        return
      }
      purchaseOrders.splice(index, 1)
      resolve()
    }, 300)
  })
}

// ─── Inventory ───────────────────────────────────────────────────────────────

const inventoryItems: InventoryItem[] = [
  { id: "1", productName: "Wireless Bluetooth Headphones", sku: "WBH-001", warehouse: "Main Warehouse", quantity: 234, unit: "pcs", minStock: 50, maxStock: 500, lastUpdated: "Jan 15, 2024" },
  { id: "2", productName: "Organic Cotton T-Shirt", sku: "OCT-042", warehouse: "East Distribution", quantity: 567, unit: "pcs", minStock: 100, maxStock: 800, lastUpdated: "Jan 15, 2024" },
  { id: "3", productName: "Stainless Steel Water Bottle", sku: "SSW-103", warehouse: "Main Warehouse", quantity: 12, unit: "pcs", minStock: 50, maxStock: 300, lastUpdated: "Jan 14, 2024" },
  { id: "4", productName: "Premium Leather Wallet", sku: "PLW-089", warehouse: "West Hub", quantity: 89, unit: "pcs", minStock: 30, maxStock: 200, lastUpdated: "Jan 14, 2024" },
  { id: "5", productName: "Smart Watch Series X", sku: "SWX-201", warehouse: "Main Warehouse", quantity: 0, unit: "pcs", minStock: 25, maxStock: 150, lastUpdated: "Jan 13, 2024" },
  { id: "6", productName: "Yoga Mat Premium", sku: "YMP-055", warehouse: "East Distribution", quantity: 156, unit: "pcs", minStock: 40, maxStock: 250, lastUpdated: "Jan 13, 2024" },
  { id: "7", productName: "Ceramic Coffee Mug Set", sku: "CCM-022", warehouse: "West Hub", quantity: 8, unit: "sets", minStock: 20, maxStock: 100, lastUpdated: "Jan 12, 2024" },
  { id: "8", productName: "Wireless Charging Pad", sku: "WCP-078", warehouse: "Main Warehouse", quantity: 423, unit: "pcs", minStock: 80, maxStock: 600, lastUpdated: "Jan 12, 2024" },
  { id: "9", productName: "Running Shoes Pro", sku: "RSP-156", warehouse: "East Distribution", quantity: 67, unit: "pairs", minStock: 50, maxStock: 200, lastUpdated: "Jan 11, 2024" },
  { id: "10", productName: "Desk Organizer Set", sku: "DOS-033", warehouse: "West Hub", quantity: 245, unit: "sets", minStock: 30, maxStock: 300, lastUpdated: "Jan 11, 2024" },
]

export async function getInventoryItems(): Promise<InventoryItem[]> {
  return new Promise((resolve) => setTimeout(() => resolve(inventoryItems), 500))
}

// ─── Customers ────────────────────────────────────────────────────────────────

const customers: Customer[] = [
  { id: "CUS-001", name: "Emily Chen", email: "emily.chen@email.com", phone: "+1 (555) 123-4567", address: "123 Main St, San Francisco, CA 94102", debtBalance: 0, totalSpent: 2847.50, orderCount: 12, status: "active", joinedDate: "Mar 15, 2023", lastOrderDate: "Jan 15, 2024", recentOrders: [{ id: "ORD-7892", date: "Jan 15, 2024", total: 342.00, status: "completed" }, { id: "ORD-7756", date: "Dec 28, 2023", total: 189.00, status: "completed" }] },
  { id: "CUS-002", name: "Michael Brown", email: "m.brown@email.com", phone: "+1 (555) 234-5678", address: "456 Oak Ave, Los Angeles, CA 90001", debtBalance: 450.00, totalSpent: 1234.00, orderCount: 8, status: "active", joinedDate: "Jun 22, 2023", lastOrderDate: "Jan 15, 2024", recentOrders: [{ id: "ORD-7891", date: "Jan 15, 2024", total: 125.00, status: "pending" }] },
  { id: "CUS-003", name: "Sarah Wilson", email: "s.wilson@email.com", phone: "+1 (555) 345-6789", address: "789 Pine Rd, Seattle, WA 98101", debtBalance: 1250.00, totalSpent: 4567.00, orderCount: 23, status: "active", joinedDate: "Jan 10, 2023", lastOrderDate: "Jan 14, 2024", recentOrders: [{ id: "ORD-7890", date: "Jan 14, 2024", total: 567.00, status: "completed" }] },
  { id: "CUS-004", name: "James Miller", email: "j.miller@email.com", phone: "+1 (555) 456-7890", address: "321 Elm St, Chicago, IL 60601", debtBalance: 0, totalSpent: 567.00, orderCount: 3, status: "active", joinedDate: "Nov 05, 2023", lastOrderDate: "Jan 14, 2024", recentOrders: [{ id: "ORD-7889", date: "Jan 14, 2024", total: 89.00, status: "pending" }] },
  { id: "CUS-005", name: "Lisa Anderson", email: "l.anderson@email.com", phone: "+1 (555) 567-8901", address: "654 Maple Dr, Austin, TX 78701", debtBalance: 89.50, totalSpent: 1890.00, orderCount: 15, status: "active", joinedDate: "Apr 18, 2023", lastOrderDate: "Jan 13, 2024", recentOrders: [{ id: "ORD-7888", date: "Jan 13, 2024", total: 234.00, status: "completed" }] },
  { id: "CUS-006", name: "David Kim", email: "d.kim@email.com", phone: "+1 (555) 678-9012", address: "987 Cedar Ln, Denver, CO 80201", debtBalance: 0, totalSpent: 890.00, orderCount: 5, status: "inactive", joinedDate: "Aug 30, 2023", lastOrderDate: "Jan 12, 2024", recentOrders: [{ id: "ORD-7887", date: "Jan 12, 2024", total: 459.00, status: "cancelled" }] },
  { id: "CUS-007", name: "Jennifer Lopez", email: "j.lopez@email.com", phone: "+1 (555) 789-0123", address: "147 Birch Way, Miami, FL 33101", debtBalance: 2340.00, totalSpent: 5670.00, orderCount: 28, status: "active", joinedDate: "Feb 14, 2023", lastOrderDate: "Jan 12, 2024", recentOrders: [{ id: "ORD-7886", date: "Jan 12, 2024", total: 178.00, status: "completed" }] },
  { id: "CUS-008", name: "Robert Taylor", email: "r.taylor@email.com", phone: "+1 (555) 890-1234", address: "258 Spruce Ct, Boston, MA 02101", debtBalance: 0, totalSpent: 3456.00, orderCount: 18, status: "active", joinedDate: "May 20, 2023", lastOrderDate: "Jan 11, 2024", recentOrders: [{ id: "ORD-7885", date: "Jan 11, 2024", total: 312.00, status: "pending" }] },
  { id: "CUS-009", name: "Amanda White", email: "a.white@email.com", phone: "+1 (555) 901-2345", address: "369 Willow Rd, Portland, OR 97201", debtBalance: 567.00, totalSpent: 2345.00, orderCount: 11, status: "inactive", joinedDate: "Jul 08, 2023", lastOrderDate: "Dec 15, 2023", recentOrders: [{ id: "ORD-7745", date: "Dec 15, 2023", total: 289.00, status: "completed" }] },
  { id: "CUS-010", name: "Christopher Lee", email: "c.lee@email.com", phone: "+1 (555) 012-3456", address: "741 Aspen Blvd, Phoenix, AZ 85001", debtBalance: 0, totalSpent: 789.00, orderCount: 4, status: "active", joinedDate: "Oct 12, 2023", lastOrderDate: "Jan 10, 2024", recentOrders: [{ id: "ORD-7878", date: "Jan 10, 2024", total: 234.00, status: "completed" }] },
]

export async function getCustomers(): Promise<Customer[]> {
  return new Promise((resolve) => setTimeout(() => resolve(customers), 500))
}

// ─── Orders ───────────────────────────────────────────────────────────────────

const orders: Order[] = [
  { id: "ORD-7892", customer: "Emily Chen", email: "emily.chen@email.com", phone: "+1 (555) 123-4567", status: "completed", total: 342.0, subtotal: 299.0, shipping: 15.0, tax: 28.0, date: "Jan 15, 2024", shippingAddress: "123 Main St, San Francisco, CA 94102", items: [{ name: "Wireless Bluetooth Headphones", sku: "WBH-001", quantity: 1, price: 149.99 }, { name: "Premium Leather Wallet", sku: "PLW-089", quantity: 2, price: 79.99 }] },
  { id: "ORD-7891", customer: "Michael Brown", email: "m.brown@email.com", phone: "+1 (555) 234-5678", status: "processing", total: 125.0, subtotal: 99.0, shipping: 12.0, tax: 14.0, date: "Jan 15, 2024", shippingAddress: "456 Oak Ave, Los Angeles, CA 90001", items: [{ name: "Organic Cotton T-Shirt", sku: "OCT-042", quantity: 3, price: 29.99 }] },
  { id: "ORD-7890", customer: "Sarah Wilson", email: "s.wilson@email.com", phone: "+1 (555) 345-6789", status: "shipped", total: 567.0, subtotal: 499.0, shipping: 25.0, tax: 43.0, date: "Jan 14, 2024", shippingAddress: "789 Pine Rd, Seattle, WA 98101", items: [{ name: "Smart Watch Series X", sku: "SWX-201", quantity: 1, price: 299.99 }, { name: "Wireless Charging Pad", sku: "WCP-078", quantity: 2, price: 39.99 }] },
  { id: "ORD-7889", customer: "James Miller", email: "j.miller@email.com", phone: "+1 (555) 456-7890", status: "pending", total: 89.0, subtotal: 69.0, shipping: 10.0, tax: 10.0, date: "Jan 14, 2024", shippingAddress: "321 Elm St, Chicago, IL 60601", items: [{ name: "Ceramic Coffee Mug Set", sku: "CCM-022", quantity: 2, price: 34.99 }] },
  { id: "ORD-7888", customer: "Lisa Anderson", email: "l.anderson@email.com", phone: "+1 (555) 567-8901", status: "completed", total: 234.0, subtotal: 199.0, shipping: 15.0, tax: 20.0, date: "Jan 13, 2024", shippingAddress: "654 Maple Dr, Austin, TX 78701", items: [{ name: "Yoga Mat Premium", sku: "YMP-055", quantity: 1, price: 45.99 }, { name: "Wireless Bluetooth Headphones", sku: "WBH-001", quantity: 1, price: 149.99 }] },
  { id: "ORD-7887", customer: "David Kim", email: "d.kim@email.com", phone: "+1 (555) 678-9012", status: "cancelled", total: 459.0, subtotal: 399.0, shipping: 20.0, tax: 40.0, date: "Jan 12, 2024", shippingAddress: "987 Cedar Ln, Denver, CO 80201", items: [{ name: "Smart Watch Series X", sku: "SWX-201", quantity: 1, price: 299.99 }, { name: "Desk Organizer Set", sku: "DOS-033", quantity: 2, price: 49.99 }] },
  { id: "ORD-7886", customer: "Jennifer Lopez", email: "j.lopez@email.com", phone: "+1 (555) 789-0123", status: "shipped", total: 178.0, subtotal: 149.0, shipping: 12.0, tax: 17.0, date: "Jan 12, 2024", shippingAddress: "147 Birch Way, Miami, FL 33101", items: [{ name: "Running Shoes Pro", sku: "RSP-156", quantity: 1, price: 129.99 }, { name: "Stainless Steel Water Bottle", sku: "SSW-103", quantity: 1, price: 24.99 }] },
  { id: "ORD-7885", customer: "Robert Taylor", email: "r.taylor@email.com", phone: "+1 (555) 890-1234", status: "processing", total: 312.0, subtotal: 269.0, shipping: 18.0, tax: 25.0, date: "Jan 11, 2024", shippingAddress: "258 Spruce Ct, Boston, MA 02101", items: [{ name: "Premium Leather Wallet", sku: "PLW-089", quantity: 1, price: 79.99 }, { name: "Wireless Bluetooth Headphones", sku: "WBH-001", quantity: 1, price: 149.99 }] },
]

export async function getOrders(): Promise<Order[]> {
  return new Promise((resolve) => setTimeout(() => resolve(orders), 500))
}

// ─── Payments ─────────────────────────────────────────────────────────────────

const payments: Payment[] = [
  { id: "PAY-001", type: "income", amount: 2450.00, category: "Sales", description: "Payment for order ORD-7892", contactName: "Emily Chen", contactType: "customer", date: "Jan 15, 2024", reference: "ORD-7892", method: "credit_card" },
  { id: "PAY-002", type: "expense", amount: 1850.00, category: "Inventory", description: "Inventory restock - Electronics", contactName: "TechSupply Co.", contactType: "supplier", date: "Jan 15, 2024", reference: "INV-4521", method: "bank_transfer" },
  { id: "PAY-003", type: "income", amount: 567.00, category: "Sales", description: "Payment for order ORD-7890", contactName: "Sarah Wilson", contactType: "customer", date: "Jan 14, 2024", reference: "ORD-7890", method: "bank_transfer" },
  { id: "PAY-004", type: "expense", amount: 450.00, category: "Utilities", description: "Monthly electricity bill", contactName: "City Power Co.", contactType: "supplier", date: "Jan 14, 2024", reference: "BILL-2024-01", method: "bank_transfer" },
  { id: "PAY-005", type: "income", amount: 1234.00, category: "Sales", description: "Partial payment for order ORD-7891", contactName: "Michael Brown", contactType: "customer", date: "Jan 13, 2024", reference: "ORD-7891", method: "cash" },
  { id: "PAY-006", type: "expense", amount: 3200.00, category: "Inventory", description: "Bulk order - Apparel items", contactName: "Fashion Wholesale Inc.", contactType: "supplier", date: "Jan 13, 2024", reference: "PO-8834", method: "check" },
  { id: "PAY-007", type: "income", amount: 890.00, category: "Sales", description: "Payment for order ORD-7888", contactName: "Lisa Anderson", contactType: "customer", date: "Jan 12, 2024", reference: "ORD-7888", method: "credit_card" },
  { id: "PAY-008", type: "expense", amount: 125.00, category: "Office Supplies", description: "Printer paper and stationery", contactName: "Office Depot", contactType: "supplier", date: "Jan 12, 2024", reference: "REC-9912", method: "credit_card" },
  { id: "PAY-009", type: "income", amount: 3456.00, category: "Sales", description: "Bulk order payment", contactName: "Robert Taylor", contactType: "customer", date: "Jan 11, 2024", reference: "ORD-7885", method: "bank_transfer" },
  { id: "PAY-010", type: "expense", amount: 780.00, category: "Shipping", description: "Monthly shipping charges", contactName: "FastShip Logistics", contactType: "supplier", date: "Jan 11, 2024", reference: "SHP-2024-01", method: "bank_transfer" },
  { id: "PAY-011", type: "income", amount: 178.00, category: "Sales", description: "Payment for order ORD-7886", contactName: "Jennifer Lopez", contactType: "customer", date: "Jan 10, 2024", reference: "ORD-7886", method: "cash" },
  { id: "PAY-012", type: "expense", amount: 2100.00, category: "Rent", description: "Monthly warehouse rent", contactName: "Metro Properties LLC", contactType: "supplier", date: "Jan 10, 2024", reference: "RENT-2024-01", method: "bank_transfer" },
]

export async function getPayments(): Promise<Payment[]> {
  return new Promise((resolve) => setTimeout(() => resolve(payments), 500))
}
