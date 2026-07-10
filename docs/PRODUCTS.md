# Products Page — `/products`

Trang quản lý danh mục sản phẩm. Dữ liệu hoàn toàn server-side: tìm kiếm, lọc, sắp xếp, phân trang đều qua API.

---

## Tính năng

### Hiển thị danh sách

| Cột | Nội dung |
|:---|:---|
| Tên sản phẩm | Tên, SKU (mono), mô tả ngắn |
| Danh mục | Tên danh mục |
| Giá vốn | Hiển thị dạng `$0.00` |
| Giá bán | Hiển thị `$0.00` + margin % so với giá vốn |
| Tồn kho | Tổng tồn kho + mức tồn kho tối thiểu |
| Trạng thái | Badge Active / Inactive |
| Actions | Dropdown menu |

**Cảnh báo hàng thấp:** Hàng có `totalStock <= minStockLevel` sẽ được tô nền vàng và hiện icon `AlertTriangle` ở đầu dòng.

---

### Tìm kiếm & Lọc

| Tính năng | Loại | Ghi chú |
|:---|:---|:---|
| Tìm kiếm theo tên / SKU | Server-side | Debounce 300ms, param `q` |
| Lọc theo danh mục | Server-side | Param `categoryPublicId` |
| Lọc theo trạng thái | Server-side | Param `isActive` (true / false / bỏ qua) |

Mỗi khi thay đổi filter hoặc search, `page` reset về 0.

---

### Sắp xếp

Nhấn vào cột **Tên sản phẩm** để thay đổi thứ tự. Mỗi lần nhấn chuyển tuần tự:

```
Mặc định (updatedAt desc) → A–Z (name asc) → Z–A (name desc) → Mặc định
```

Mặc định sắp xếp theo `updatedAt desc` — sản phẩm vừa thêm hoặc sửa sẽ xuất hiện đầu tiên.

Sắp xếp là **server-side**: params `sortBy` (`name` | `updatedAt`) và `sort` (`asc` | `desc`).

---

### Phân trang

- 20 sản phẩm mỗi trang (server-side).
- Hiển thị nút **Previous / Next** và `trang hiện tại / tổng số trang` khi có nhiều hơn 1 trang.

---

### Thêm sản phẩm

Nút **Add Product** mở `AddProductModal`. Sau khi submit thành công:
- Gọi `POST /api/businesses/{businessId}/products`
- Reset về trang 0
- Trigger refetch danh sách
- Hiện thông báo thành công (tự ẩn sau 3 giây)

---

### Chỉnh sửa sản phẩm

Dropdown Actions → **Edit** mở `EditProductModal` điền sẵn dữ liệu hiện tại. Sau khi submit:
- Gọi `PUT /api/businesses/{businessId}/products/{publicId}`
- Trigger refetch danh sách
- Hiện thông báo thành công

---

### Đổi trạng thái Active / Inactive

Dropdown Actions → **Activate / Deactivate**:
- Gọi `PATCH /api/businesses/{businessId}/products/{publicId}/status`
- Trigger refetch tức thì (không cần confirm)

---

### Xóa sản phẩm

Dropdown Actions → **Delete** hiện `confirm()` trước khi xóa:
- Gọi `DELETE /api/businesses/{businessId}/products/{publicId}`
- Trigger refetch danh sách
- Hiện thông báo thành công

Trong lúc đang xóa, nút Actions của dòng đó bị disable (`isDeleting` state).

---

### Xem chi tiết

Dropdown Actions → **View Detail** điều hướng sang `/products/{id}`.

---

## Loading & UX

| Tình huống | Behavior |
|:---|:---|
| Lần đầu mở trang | Full-page loading (text "Loading...") cho đến khi fetch xong |
| Tìm kiếm / đổi filter / chuyển trang | Bảng cập nhật tại chỗ, không re-render toàn trang |
| Kết quả tìm kiếm trả về 0 | Hiện empty state trong bảng, không flash toàn trang |
| Thêm / sửa / xóa thành công | Thông báo xanh lá, tự ẩn sau 3 giây |
| Lỗi API | Thông báo đỏ |

---

## API Endpoints sử dụng

| Method | Endpoint | Mục đích |
|:---|:---|:---|
| GET | `/api/businesses/{businessId}/products/search` | Lấy danh sách (có phân trang, filter, sort) |
| GET | `/api/businesses/{businessId}/categories` | Load danh sách category cho filter |
| GET | `/api/businesses/{businessId}/units` | Load danh sách unit cho modal |
| POST | `/api/businesses/{businessId}/products` | Thêm sản phẩm |
| PUT | `/api/businesses/{businessId}/products/{publicId}` | Sửa sản phẩm |
| PATCH | `/api/businesses/{businessId}/products/{publicId}/status` | Đổi trạng thái |
| DELETE | `/api/businesses/{businessId}/products/{publicId}` | Xóa sản phẩm |
