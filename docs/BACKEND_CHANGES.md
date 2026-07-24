# Ảnh hưởng từ đợt sửa bảo mật Backend (07/2026)

Backend đã xử lý toàn bộ vấn đề trong 4 tài liệu review `api/docs/check_260704/01–04`
(database schema, auth/security, business/store/subscription, product/customer/supplier).
Tài liệu này liệt kê các thay đổi **ảnh hưởng đến web** và trạng thái xử lý phía web.

---

## A. Cần sửa code web

### A1. `adminChangePlan` thiếu `billingCycle` — BREAKING với gói trả phí

- **Backend:** `PATCH /api/admin/subscriptions/{businessId}/plan` giờ nhận
  `{ plan, billingCycle }`. `billingCycle` **bắt buộc** khi `plan` là BASIC/PRO
  (dùng tính `expiresAt`); `plan = FREE` thì bỏ trống.
- **Web hiện tại:** `lib/api.ts → adminChangePlan()` chỉ gửi `{ plan }` →
  đổi sang gói trả phí sẽ nhận **400 VALIDATION_ERROR**.
- **Việc cần làm:** thêm tham số `billingCycle` vào `adminChangePlan()` và UI chọn
  chu kỳ (MONTHLY/YEARLY) ở trang admin khi chọn gói trả phí.

### A2. Setup page crash khi `/api/businesses/default` trả `store: null`

- **Backend:** endpoint giờ **idempotent** — nếu user đã là OWNER của một business,
  trả về business hiện có kèm store/warehouse đầu tiên, **có thể `null`**
  (business chưa có store nào).
- **Web hiện tại:** `app/(auth)/setup/page.tsx` gọi `selectStore(result.store.id)`
  trực tiếp → crash `TypeError` nếu `store` là `null`.
- **Việc cần làm:** kiểm tra `result.store` trước khi dùng; nếu `null` hiển thị lỗi
  hướng dẫn thay vì crash.
- **Ghi chú liên quan (bug có sẵn, không do backend đổi):** sau khi tạo business,
  `selectStore()` không tìm thấy business trong `memberships` (đang rỗng) nên
  `auth_business_id` không được set → các trang catalog ném "No business selected".
  Nên set business/store trực tiếp từ response thay vì tra memberships.

### A3. `payCustomer` / `paySupplier` chưa gửi `storeId`

- **Backend:** `PUT .../customers/{publicId}/pay` và `.../suppliers/{publicId}/pay`
  nhận thêm `storeId` (tùy chọn). Không gửi → backend fallback **store đầu tiên
  của business** kèm log warn — phiếu thu/chi công nợ có thể gắn sai store khi
  business có nhiều store.
- **Web hiện tại:** `lib/api.ts → payCustomer()/paySupplier()` chỉ gửi
  `{ amount, paymentMethod }`.
- **Việc cần làm:** gửi kèm `storeId` = store đang chọn (`auth_store_id`).

### A4. Form đăng ký: ràng buộc username / password mới

- **Backend:** `username` phải khớp `^[a-zA-Z0-9._-]+$` (không cho `@` — tránh
  xung đột định danh email); `password` từ **6–72 ký tự** (giới hạn BCrypt).
- **Web hiện tại:** `app/(auth)/register/page.tsx` chỉ check password ≥ 6 —
  nhập sai sẽ nhận 400 với message tiếng Anh từ server.
- **Việc cần làm:** validate client-side (pattern username, password ≤ 72) với
  thông báo i18n trước khi submit.

### A5. Lỗi 400 mới khi xóa dữ liệu còn ràng buộc

Backend giờ chặn xóa và trả `400 VALIDATION_ERROR` (message tiếng Anh) cho:

| Thao tác | Điều kiện chặn |
|:---|:---|
| Xóa category | còn sản phẩm (chưa xóa) tham chiếu |
| Xóa unit | còn sản phẩm tham chiếu; unit hệ thống không được sửa/xóa (403) |
| Xóa product | còn tồn kho |
| Xóa customer | còn công nợ (`debtBalance > 0`) |
| Xóa supplier | còn công nợ |
| Tạo/sửa unit | tên trùng unit khác trong business **hoặc trùng unit hệ thống** |

- **Web hiện tại:** các trang hiển thị `err.message` (tiếng Anh thô từ server).
- **Việc cần làm:** map `ApiError.code/message` sang thông báo i18n thân thiện
  ở các trang categories, units, products, customers, suppliers.

---

## B. Thay đổi hành vi — không cần sửa code, cần biết

### Auth / token

- **Reuse-detection refresh token giờ hoạt động thật:** dùng lại refresh token cũ
  (đã rotate) → backend thu hồi **toàn bộ** token của user. Web đã single-flight
  refresh trong 1 tab (`_refreshPromise`), nhưng **2 tab song song** cùng refresh
  một token có thể kích hoạt revoke-all → cả 2 tab bị đăng xuất. Backlog: đồng bộ
  refresh giữa các tab (BroadcastChannel / Web Locks).
- **Đổi mật khẩu thu hồi mọi refresh token** — phiên khác sẽ bị 401 ở lần refresh
  kế tiếp và tự redirect login (web hiện chưa có UI đổi mật khẩu).
- **User bị khóa/xóa không refresh được nữa** (trước đây có thể duy trì phiên
  vô thời hạn) — web tự xử lý qua `clearAuthAndRedirect()`.
- **Rate limit mới cho `/api/auth/refresh`:** 20 req/60s/IP — single-flight hiện
  tại là đủ, không được gọi refresh trong vòng lặp.
- **401 từ security entry point giờ trả JSON chuẩn**
  `{success:false, error:{code:"UNAUTHORIZED"}}` — trước đây là trang lỗi mặc định.
  Việc parse `body.error` trong `apiFetch` giờ nhất quán cho mọi trường hợp.

### Catalog / partner

- **Tìm kiếm:** ký tự `%`, `_`, `\` trong từ khóa giờ được hiểu **literal**
  (backend escape wildcard); FTS bỏ dấu tiếng Việt (unaccent) cho các luồng dùng FTS.
- **`updatedAt` giờ cập nhật đúng khi sửa bản ghi** — sort mặc định
  `updatedAt desc` ở trang Products phản ánh chính xác "vừa sửa lên đầu".
- **`minStockLevel` bắt buộc ≥ 0** khi tạo/sửa product (form web đã gửi số ≥ 0).
- **SKU/tên được trim** trước khi lưu và so trùng.

### Payment / inventory

- **`paymentMethod` là enum 6 giá trị:** `CASH`, `BANK_TRANSFER`, `CREDIT_CARD`,
  `DEBIT_CARD`, `MOBILE_PAYMENT`, `OTHER` — giá trị lạ bị từ chối ngay (400).
  Web đang gửi `CASH` — hợp lệ; có thể mở rộng dropdown sau.
- **`refundMethod` / trạng thái return order là enum** — giá trị trong
  `lib/types.ts` (`CASH | BANK_TRANSFER | STORE_CREDIT`) đã khớp backend.
- **Điều chỉnh kho:** `quantity` là **delta có dấu** (âm = giảm), giá trị `0` bị chặn.

### Subscription

- **Hết hạn (EXPIRED) → limit rơi về gói FREE** ngay lập tức; cho phép **mua lại
  gói** sau khi hết hạn (upgrade cùng plan được chấp nhận); mua gói FREE bị chặn.
- **Invoice PENDING quá 7 ngày tự chuyển FAILED** (job hằng ngày) — trang
  subscription nên coi invoice FAILED là "hết hạn thanh toán".

### Không ảnh hưởng

- API quản lý thành viên store (add/update/remove member, role chỉ MANAGER/STAFF,
  404 khi member không thuộc store) — web **chưa có UI** quản lý thành viên store.
- `maxOrdersPerMonth` bị xóa khỏi subscription response — web không dùng field này.

---

## C. Đợt "Trợ lý cấp business" (đã sync)

Backend thêm role `ROLE_BUSINESS_MANAGER` (trợ lý) — quản mọi store trong business,
KHÔNG đụng billing/subscription, hồ sơ business, tạo store, hay quản lý trợ lý khác.

**Backend mới:**
- `GET/POST/PATCH/DELETE /api/businesses/{businessId}/members` (owner-only) —
  POST `{userId, isActive}`, PATCH `{isActive}`. Trợ lý tính vào quota `max_staff`.
- `GET /api/users/lookup?username=` (authenticated) → `{userId, username, fullName, isActive}` —
  để owner lấy `userId` khi thêm trợ lý.
- Auth response: `membership.stores[].role` mang tên business-role thật
  (`ROLE_OWNER` / `ROLE_BUSINESS_MANAGER`) → web phân biệt được owner vs trợ lý.

**Đã làm ở web:**
- Trang **Team** `app/(dashboard)/team/page.tsx` (owner-only): list thành viên business,
  thêm trợ lý (qua lookup username), bật/tắt, gỡ.
- `lib/api.ts`: `lookupUser`, `getBusinessMembers`, `addBusinessMember`,
  `setBusinessMemberActive`, `removeBusinessMember`.
- `lib/types.ts`: `RoleName`, `BusinessMember`, `UserLookup`.
- Sidebar: mục "Team" chỉ hiện cho OWNER (suy từ `membership.stores[].role`).
- Settings: badge role cho `ROLE_BUSINESS_MANAGER`.
- i18n: section `team` (vi/en).

**Ghi chú:**
- `orders/purchase_orders.paymentMethod` nay là enum 6 giá trị — web đang gửi `CASH`
  (hợp lệ), không breaking. Dropdown mở rộng để backlog.
- Gate owner-only ở web chỉ để ẩn UI; backend vẫn enforce owner-only (403) ở tầng API.
