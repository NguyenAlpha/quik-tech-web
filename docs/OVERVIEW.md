# StockFlow Web — Tổng quan

## 1. Project là gì

**StockFlow** là giao diện web admin cho hệ thống quản lý bán hàng và kho vận **QuikTech**.
Được xây dựng bằng Next.js, hiện tại đang ở giai đoạn **UI prototype** — giao diện đã hoàn chỉnh
nhưng toàn bộ dữ liệu còn là mock (giả), chưa kết nối backend thật.

---

## 2. Tech Stack

| Thành phần | Công nghệ | Ghi chú |
|:---|:---|:---|
| Framework | Next.js 15 (App Router) | React 19 |
| Styling | Tailwind CSS 4 | Utility-first CSS |
| UI Components | Shadcn/ui + Radix UI | Component library |
| Icons | Lucide React | SVG icon pack |
| Charts | Recharts | Dashboard charts |
| Forms | React Hook Form + Zod | Validation |
| Notifications | Sonner | Toast alerts |
| Dark mode | next-themes | Light/Dark toggle |
| Analytics | Vercel Analytics | Chỉ bật ở production |

---

## 3. Trạng thái hiện tại

| Tính năng | Trạng thái |
|:---|:---|
| Giao diện các trang | Hoàn chỉnh |
| Mock data (dữ liệu giả) | Có — xem `lib/api.ts` |
| Kết nối backend API | Chưa có |
| Đăng nhập / Auth | Chưa có — mọi trang đều public |
| Phân quyền route | Chưa có |
| Dữ liệu bền vững | Không — reset khi refresh trang |

> Hiện tại user được hardcode là "John Doe" trong header.
> Nút Logout có nhưng chưa có chức năng.

---

## 4. Các trang đang có

| Route | Trang |
|:---|:---|
| `/` | Dashboard: KPI cards, biểu đồ doanh thu, cảnh báo hàng thấp, đơn gần đây |
| `/products` | Danh sách sản phẩm, tạo mới, xóa |
| `/suppliers` | Danh sách nhà cung cấp, tạo mới, xóa |
| `/purchase-orders` | Đơn nhập hàng, tạo mới, cập nhật trạng thái, xóa |
| `/orders` | Đơn bán (data cứng, chưa có CRUD) |
| `/customers` | Khách hàng (UI tĩnh) |
| `/inventory` | Tồn kho (UI tĩnh) |
| `/payments` | Thanh toán (UI tĩnh) |
| `/settings` | Cài đặt (UI tĩnh) |

---

## 5. Lộ trình việc cần làm

### Bước 1 — Kết nối backend
Thay toàn bộ mock trong `lib/api.ts` bằng `fetch()` gọi đến Spring Boot API.

### Bước 2 — Thêm Authentication
Tích hợp đăng nhập với JWT từ backend. Dùng middleware.ts để bảo vệ các route cần đăng nhập.

### Bước 3 — Hoàn thiện các trang UI tĩnh
Các trang Orders, Customers, Inventory, Payments hiện chỉ có layout — cần thêm CRUD thật.

### Bước 4 — Production
Cấu hình biến môi trường, deploy lên Vercel hoặc server Node.js.

---

## 6. Khởi động dev server

```bash
cd apps/web
npm install
npm run dev
# Mở http://localhost:3000
```
