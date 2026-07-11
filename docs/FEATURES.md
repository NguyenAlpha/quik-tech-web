# Features — Tính Năng

Bảng tổng hợp trạng thái từng tính năng của web app.

---

## Auth

| Tính năng | Trạng thái | Ghi chú |
|:---|:---|:---|
| Đăng nhập | Hoàn chỉnh | JWT từ Spring Boot |
| Đăng ký | Hoàn chỉnh | Tự động login sau register |
| Đăng xuất | Hoàn chỉnh | Xóa token + redirect về /login |
| Bảo vệ route | Hoàn chỉnh | middleware.ts redirect nếu chưa login |
| Redirect nếu đã login | Hoàn chỉnh | /login, /register redirect về / nếu có token |
| Refresh token | Hoàn chỉnh | Silent refresh: `apiFetch` tự gọi `POST /api/auth/refresh` khi nhận 401, retry request gốc, chỉ redirect `/login` nếu refresh cũng thất bại. Promise dedup tránh gọi song song. |
| Tạo store mới | Hoàn chỉnh | `/setup` auto-gọi `POST /api/businesses/default`, redirect về `/` sau khi xong |

---

## Products — Sản phẩm

Chi tiết xem [`PRODUCTS.md`](./PRODUCTS.md).

| Tính năng | Trạng thái | Ghi chú |
|:---|:---|:---|
| Xem danh sách | Hoàn chỉnh | Server-side, 20/trang |
| Tìm kiếm theo tên / SKU | Hoàn chỉnh | Server-side, debounce 300ms |
| Lọc theo danh mục | Hoàn chỉnh | Server-side |
| Lọc theo trạng thái | Hoàn chỉnh | Server-side |
| Sắp xếp theo tên / ngày sửa | Hoàn chỉnh | Server-side, mặc định updatedAt desc |
| Phân trang | Hoàn chỉnh | Server-side |
| Thêm sản phẩm mới | Hoàn chỉnh | Modal với đầy đủ fields |
| Chỉnh sửa sản phẩm | Hoàn chỉnh | Modal điền sẵn dữ liệu |
| Xóa sản phẩm | Hoàn chỉnh | Confirm trước khi xóa |
| Đổi trạng thái active/inactive | Hoàn chỉnh | PATCH /status |
| Cảnh báo hàng thấp | Hoàn chỉnh | Tô vàng khi totalStock ≤ minStockLevel |
| Xem chi tiết sản phẩm | Hoàn chỉnh | Điều hướng sang `/products/{id}` |
| Import từ CSV | Hoàn chỉnh | Nút "Import CSV" → modal dropzone → `POST /api/businesses/{id}/products/import` (multipart), report kết quả theo từng row (imported / skipped / errors), nút download template |

---

## Suppliers — Nhà cung cấp

| Tính năng | Trạng thái | Ghi chú |
|:---|:---|:---|
| Xem danh sách | Hoàn chỉnh | Kết nối API thật |
| Tìm kiếm theo tên | Hoàn chỉnh | Client-side |
| Lọc theo trạng thái | Hoàn chỉnh | Client-side |
| Thêm nhà cung cấp mới | Hoàn chỉnh | Modal: tên, SĐT, email, địa chỉ |
| Chỉnh sửa nhà cung cấp | Hoàn chỉnh | Dropdown menu → Edit modal điền sẵn dữ liệu |
| Xóa nhà cung cấp | Hoàn chỉnh | Dropdown menu → confirm trước khi xóa |
| Xem chi tiết / lịch sử đơn | Hoàn chỉnh | Modal: 5 đơn nhập gần nhất theo supplierPublicId |

---

## Customers — Khách hàng

| Tính năng | Trạng thái | Ghi chú |
|:---|:---|:---|
| Xem danh sách | Hoàn chỉnh | Kết nối API thật |
| Tìm kiếm theo tên | Hoàn chỉnh | Client-side |
| Lọc theo trạng thái | Hoàn chỉnh | Client-side |
| Thêm khách hàng mới | Hoàn chỉnh | Modal: tên, SĐT, email, địa chỉ |
| Chỉnh sửa khách hàng | Hoàn chỉnh | Dropdown menu → Edit modal điền sẵn dữ liệu |
| Xóa khách hàng | Hoàn chỉnh | Dropdown menu → xóa ngay |
| Xem chi tiết khách hàng | Hoàn chỉnh | Modal: thông tin cơ bản + số dư nợ |
| Xem lịch sử đơn hàng | Hoàn chỉnh | Modal: 5 đơn hàng gần nhất theo customerPublicId |

---

## Purchase Orders — Đơn nhập hàng

| Tính năng | Trạng thái | Ghi chú |
|:---|:---|:---|
| Xem danh sách | Hoàn chỉnh | Kết nối API thật |
| Tìm kiếm theo mã / nhà cung cấp | Hoàn chỉnh | Client-side |
| Lọc theo trạng thái | Hoàn chỉnh | Client-side |
| Tạo đơn nhập mới | Hoàn chỉnh | Modal: supplier, warehouse, items |
| Quét mã vạch khi tạo đơn nhập | Hoàn chỉnh | Nút "Quét mã" trong modal → tự thêm sản phẩm vào items theo costPrice |
| Hủy đơn nhập | Hoàn chỉnh | Gọi PUT /purchases/{id}/cancel |
| Đổi trạng thái (received) | Hoàn chỉnh | Gọi PUT /purchases/{id}/receive |
| Xem chi tiết items | Hoàn chỉnh | Expand row trong bảng |
| Chỉnh sửa đơn nhập | Hoàn chỉnh | Nút Edit trong modal (chỉ khi PENDING) → PUT /purchases/{id} |

---

## Orders — Đơn bán hàng

| Tính năng               | Trạng thái | Ghi chú                             |
|:------------------------|:-----------|:------------------------------------|
| Xem danh sách           | Hoàn chỉnh | Kết nối API thật                    |
| Tìm kiếm theo mã đơn    | Hoàn chỉnh | Kết nối API thật                    |
| Lọc theo trạng thái     | Hoàn chỉnh | Kết nối API thật                    |
| Lọc theo ngày tháng năm | Hoàn chỉnh | Kết nối API thật                    |
| Xem chi tiết đơn hàng   | Hoàn chỉnh | Modal: items, tổng tiền, trạng thái |
| Tạo đơn bán mới         | Hoàn chỉnh | Kết nối API thật                    |
| Quét mã vạch khi tạo đơn | Hoàn chỉnh | Nút "Quét mã" trong modal → camera → decode SKU → tự thêm sản phẩm vào danh sách items; quét liên tiếp được, tự tăng quantity nếu đã có |
| Đổi trạng thái đơn      | Hoàn chỉnh | Kết nối API thật                    |
| In hóa đơn              | Hoàn chỉnh | Popup window, auto-print, inline styles A4 |
| Xuất Excel              | Hoàn chỉnh | Nút "Export Excel" → `GET /export/orders?from=&to=`, tự truyền filter ngày đang active |

Tạo đơn bán mới:
UI: modal với form nhập mã đơn, chọn kho, chọn khách hàng,
chọn thêm sản phẩm (cho phép điều chỉnh số lượng, giá bán, giảm giá, loại giảm giá),
giảm giá trên toàn đơn, chọn loại giảm giá, thuế, ghi ghi chứ (tùy chọn),
nhập số tiền thanh toán, phương thức thanh toán, nút thoát đơn, nút tạo đơn bán hàng.
UX: mặc định nếu chỉ có 1 kho thì chọn kho đó,
mặc định khách hàng là khách vãng lai,
mặc định số tiền thanh toán = với số tiền đơn bán hàng,
là khách vãng lai thì không được còn nợ > 0.

Đổi trạng thái đơn:

---

## Return Orders — Đơn trả hàng

| Tính năng | Trạng thái | Ghi chú |
|:---|:---|:---|
| Xem danh sách | Hoàn chỉnh | Kết nối API thật |
| Tìm kiếm theo mã đơn trả | Hoàn chỉnh | Client-side |
| Lọc theo trạng thái | Hoàn chỉnh | Client-side |
| Xem chi tiết | Hoàn chỉnh | Modal: items, tổng hoàn tiền, trạng thái |
| Tạo đơn trả hàng mới | Hoàn chỉnh | Modal: mã đơn trả, đơn gốc, kho, lý do, hình thức hoàn tiền, items |
| Hoàn tất đơn trả (Complete) | Hoàn chỉnh | PUT /returns/{id}/complete — cộng lại tồn kho, giảm công nợ |
| Hủy đơn trả (Cancel) | Hoàn chỉnh | PUT /returns/{id}/cancel — chỉ khi PENDING |

---

## Warehouses — Kho hàng

| Tính năng | Trạng thái | Ghi chú |
|:---|:---|:---|
| Xem danh sách kho | Hoàn chỉnh | Bảng: tên, địa chỉ, badge Active/Inactive |
| Tìm kiếm theo tên | Hoàn chỉnh | Client-side |
| Thêm kho mới | Hoàn chỉnh | Modal: tên, địa chỉ, toggle active |
| Chỉnh sửa kho | Hoàn chỉnh | Modal điền sẵn dữ liệu |
| Xóa kho | Hoàn chỉnh | Confirm dialog → soft delete |
| Toggle Active/Inactive | Hoàn chỉnh | Switch trong modal |

---

## Inventory — Tồn kho

| Tính năng | Trạng thái | Ghi chú |
|:---|:---|:---|
| Xem tồn kho | Hoàn chỉnh | Kết nối API thật |
| Tìm kiếm theo tên sản phẩm | Hoàn chỉnh | Client-side |
| Lọc theo warehouse | Hoàn chỉnh | Client-side, warehouses load từ API |
| Điều chỉnh tồn kho (Add/Remove) | Hoàn chỉnh | Modal → POST `/inventory/adjust`, reload sau khi thành công |
| Chuyển kho | Hoàn chỉnh | Nút "Transfer Stock" → modal chọn kho nguồn/đích + số lượng → `POST /inventory/transfer`, atomic transaction |
| Xuất Excel | Hoàn chỉnh | Nút "Export Excel" → `GET /export/inventory`, download file xlsx |

---

## Payments — Thanh toán

| Tính năng | Trạng thái | Ghi chú |
|:---|:---|:---|
| Xem danh sách | Hoàn chỉnh | Kết nối API thật |
| Tìm kiếm | Hoàn chỉnh | Client-side |
| Xem chi tiết | Hoàn chỉnh | Modal |
| Tạo payment mới | Hoàn chỉnh | Modal: loại (thu/chi), chọn KH/NCC, số tiền, phương thức, ghi chú |
| Xóa payment | Hoàn chỉnh | `DELETE /payments/{id}` — hoàn trả debt balance cho customer/supplier, xóa cứng |

---

## Dashboard (/)

| Tính năng | Trạng thái | Ghi chú |
|:---|:---|:---|
| KPI Cards | Hoàn chỉnh | Doanh thu, đơn hàng, doanh thu thu được, tổng khách hàng |
| Biểu đồ doanh thu | Hoàn chỉnh | 6 tháng gần nhất từ mv_monthly_revenue |
| Cảnh báo hàng thấp | Hoàn chỉnh | Từ mv_inventory_summary, top 10 |
| Đơn hàng gần đây | Hoàn chỉnh | 5 đơn mới nhất từ orders table |

---

## Notifications — Thông báo (Header Bell)

| Tính năng | Trạng thái | Ghi chú |
|:---|:---|:---|
| Badge tổng số thông báo | Hoàn chỉnh | Số đỏ trên icon chuông, ẩn khi = 0 |
| Polling tự động | Hoàn chỉnh | `GET /notifications/summary` mỗi 60s |
| Cảnh báo hàng thấp | Hoàn chỉnh | Hiển thị số lượng + list top 10 sản phẩm khi mở dropdown |
| Thông báo hóa đơn chờ duyệt | Hoàn chỉnh | Đếm PENDING invoices từ backend |
| Trạng thái rỗng | Hoàn chỉnh | "Không có thông báo mới" khi count = 0 |

Backend: `GET /api/stores/{storeId}/notifications/summary` + `GET /api/stores/{storeId}/notifications/low-stock` (JOIN FETCH, top 10, `@PreAuthorize isMember`).

---

## UI / UX chung

| Tính năng | Trạng thái | Ghi chú |
|:---|:---|:---|
| Dark / Light mode | Hoàn chỉnh | Lưu preference vào localStorage |
| Ngôn ngữ EN / VI | Hoàn chỉnh | Lưu preference vào localStorage |
| Responsive layout | Hoàn chỉnh | Sidebar collapse; tất cả table có mobile card view (sm:hidden/hidden sm:block); modal có max-width responsive; date input, detail grid co giãn theo màn hình |
| Loading states | Một phần | Có ở page load, thiếu ở một số chỗ |
| Error messages | Hoàn chỉnh | PageError component với retry button ở tất cả các trang |
| Toast notifications | Hoàn chỉnh | Sonner, `richColors`, `top-right` — dùng nhất quán toàn app |
| Skeleton loading | Hoàn chỉnh | Dashboard có DashboardSkeleton riêng; modal detail dùng skeleton rows |

---

## Settings (/settings)

| Tính năng | Trạng thái | Ghi chú |
|:---|:---|:---|
| Xem thông tin business | Hoàn chỉnh | Hiển thị tên, email, phone, address |
| Chỉnh sửa business | Hoàn chỉnh | Modal PATCH `/api/businesses/{id}` |
| Tạo store mới | Hoàn chỉnh | Modal POST `/api/businesses/{id}/stores` |
| Tóm tắt gói subscription | Hoàn chỉnh | Compact card: plan badge + expiry + link "Manage Subscription" → `/subscription` |
| Thông tin user profile | Hoàn chỉnh | Username, email, phone, role badge |

---

## Subscription (/subscription)

| Tính năng | Trạng thái | Ghi chú |
|:---|:---|:---|
| Xem và so sánh 3 gói (FREE/BASIC/PRO) | Hoàn chỉnh | Card layout với giá và giới hạn, highlight gói hiện tại |
| Chuyển đổi chu kỳ thanh toán | Hoàn chỉnh | Toggle Monthly/Yearly trong header |
| Nâng cấp gói (Upgrade) | Hoàn chỉnh | Owner chọn plan + cycle → modal thanh toán (checkout) |
| Hạ cấp gói (Downgrade) | Hoàn chỉnh | Owner chọn gói thấp hơn, hiệu lực cuối chu kỳ, không hoàn tiền |
| Hủy lịch hạ cấp | Hoàn chỉnh | Owner hủy pending downgrade trước khi hết hạn |
| Modal thanh toán (Checkout) | Hoàn chỉnh | Hiển thị QR code + thông tin TK ngân hàng + nội dung CK tự sinh + nút copy |
| Nội dung CK tự động | Hoàn chỉnh | Backend sinh sẵn theo format `{plan} {invoiceId}` (VD: "basic 5"), owner copy để chuyển khoản |
| Hủy thanh toán | Hoàn chỉnh | DELETE `/invoices/{id}` — xóa invoice PENDING, ẩn banner |
| Xác nhận đã thanh toán | Hoàn chỉnh | Đóng modal + toast thông báo đang xử lý |
| Banner invoice đang chờ | Hoàn chỉnh | Hiển thị khi có PENDING invoice, nút "Xem chi tiết" mở lại checkout |
| Lịch sử hóa đơn | Hoàn chỉnh | Bảng các invoice với trạng thái và ngày tạo |

---

## Admin System (/admin/*)

Khu vực riêng cho `SUPER_ADMIN` — login tách biệt tại `/admin/login`, layout dark theme độc lập (không dùng sidebar cửa hàng). Token lưu trong `admin_token` riêng.

### /admin/login

| Tính năng | Trạng thái | Ghi chú |
|:---|:---|:---|
| Trang login riêng | Hoàn chỉnh | Dark theme (đỏ/slate), cùng API `POST /api/auth/login`, lưu `admin_token` riêng, redirect về `/admin/stats` sau khi đăng nhập |

### /admin/stats — Thống kê hệ thống

| Tính năng | Trạng thái | Ghi chú |
|:---|:---|:---|
| KPI cards | Hoàn chỉnh | Tổng businesses, tổng users (+ active), pending invoices, doanh thu tháng này |
| Phân bổ theo gói (FREE/BASIC/PRO) | Hoàn chỉnh | Progress bars theo tỷ lệ |
| Trạng thái subscription (Active/Expired) | Hoàn chỉnh | Cards số lượng |
| Biểu đồ doanh thu subscription 6 tháng | Hoàn chỉnh | Bar chart từ `subscription_invoices` WHERE PAID |

### /admin/subscriptions — Quản lý Subscription

| Tính năng | Trạng thái | Ghi chú |
|:---|:---|:---|
| Xem danh sách hóa đơn PENDING | Hoàn chỉnh | Phân trang, 20/trang |
| Xem nội dung chuyển khoản | Hoàn chỉnh | Cột Transfer Reference trong bảng |
| Xác nhận thanh toán (Confirm) | Hoàn chỉnh | Kích hoạt subscription, ghi admin note |
| Từ chối thanh toán (Reject) | Hoàn chỉnh | Hóa đơn → FAILED, ghi lý do bắt buộc |
| Override plan trực tiếp | Hoàn chỉnh | Select business → xem sub → chọn plan mới → PATCH `/api/admin/subscriptions/{id}/plan` |

### /admin/businesses — Danh sách Businesses

| Tính năng | Trạng thái | Ghi chú |
|:---|:---|:---|
| Xem danh sách tất cả businesses | Hoàn chỉnh | Search theo tên, load từ `GET /api/businesses` |
| Xem chi tiết subscription | Hoàn chỉnh | Click row → modal: plan, status, expiry, billing cycle. Plan badge hiển thị ngay trong bảng (pre-loaded khi vào trang) |
| Override plan từ modal | Hoàn chỉnh | PATCH `/api/admin/subscriptions/{id}/plan` ngay trong modal |

### /admin/users — Quản lý người dùng

| Tính năng | Trạng thái | Ghi chú |
|:---|:---|:---|
| Xem danh sách người dùng | Hoàn chỉnh | Tìm kiếm debounce 400ms, phân trang 20/trang |
| Khóa / Mở khóa tài khoản | Hoàn chỉnh | PATCH `/api/admin/users/{id}/status` |
| Xóa tài khoản | Hoàn chỉnh | Confirm dialog → DELETE `/api/admin/users/{id}` |
