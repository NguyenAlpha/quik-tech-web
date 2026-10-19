// Độ dài tối đa của các field nhập liệu — phải khớp @Size/@Pattern trong api/.../dto/request.
// Backend nới giới hạn thì sửa tại đây.
export const FIELD_LIMITS = {
  register: { username: 25, email: 30, fullName: 30 },       // RegisterRequest
  profile: { fullName: 30, email: 30, phone: 12 },           // UpdateProfileRequest
  business: { name: 30, email: 30, phone: 12 },              // BusinessCreateRequest
  store: { name: 30, email: 30, phone: 12 },                 // StoreCreateRequest
  category: { name: 30, description: 100 },                  // CategoryUpsertRequest
  unit: { name: 30, abbreviation: 10 },                      // UnitUpsertRequest
  product: { sku: 50, name: 60, description: 100 },          // ProductUpsertRequest
  warehouse: { name: 100 },                                  // WarehouseUpsertRequest
  partner: { code: 20, name: 200, phone: 20, email: 100, address: 2000 }, // Customer/SupplierUpsertRequest
  userActionReason: 100,                                     // SetUserStatusRequest, DeleteUserRequest
} as const
