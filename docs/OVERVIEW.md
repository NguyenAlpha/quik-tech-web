# StockFlow Web — Tổng quan

## 1. Project là gì

**StockFlow** là giao diện web admin cho hệ thống quản lý bán hàng và kho vận **QuikTech**.
Được xây dựng bằng Next.js 15 (App Router), kết nối với backend **Spring Boot** qua REST API,
xác thực bằng **JWT**.

---

## 2. Tech Stack

| Thành phần | Công nghệ | Ghi chú |
|:---|:---|:---|
| Framework | Next.js 15 (App Router) | React 19 |
| Styling | Tailwind CSS 4 | Utility-first CSS |
| UI Components | Shadcn/ui + Radix UI | Component library |
| Icons | Lucide React | SVG icon pack |
| Charts | Recharts | Dashboard charts |
| Notifications | Sonner | Toast alerts |
| Dark mode | next-themes | Light/Dark toggle |
| Analytics | Vercel Analytics | Chỉ bật ở production |

---

## 3. Trạng thái hiện tại

| Tính năng | Trạng thái |
|:---|:---|
| Giao diện các trang | Hoàn chỉnh |
| Kết nối backend API | Hoàn chỉnh — xem `lib/api.ts` |
| Đăng nhập / Đăng ký | Hoàn chỉnh — JWT từ Spring Boot |
| Phân quyền route | Hoàn chỉnh — `middleware.ts` bảo vệ tất cả route |
| Đa ngôn ngữ EN/VI | Hoàn chỉnh |
| Dark / Light mode | Hoàn chỉnh |
| Dữ liệu bền vững | Có — lưu trên database qua backend |

---

## 4. Các trang hiện có

| Route | Trang | Tính năng |
|:---|:---|:---|
| `/login` | Đăng nhập | Form login, gọi API auth |
| `/register` | Đăng ký | Form register, tự động login sau khi tạo tài khoản |
| `/` | Dashboard | KPI cards, biểu đồ doanh thu, cảnh báo hàng thấp, đơn gần đây |
| `/products` | Sản phẩm | Xem, thêm, xóa, tìm kiếm, lọc theo category/status |
| `/suppliers` | Nhà cung cấp | Xem, thêm, xóa, tìm kiếm, lọc theo status |
| `/purchase-orders` | Đơn nhập hàng | Xem, thêm, hủy, đổi trạng thái, tìm kiếm, lọc |
| `/orders` | Đơn bán hàng | Xem danh sách, xem chi tiết, tìm kiếm, lọc |
| `/customers` | Khách hàng | Xem, thêm, xem chi tiết, tìm kiếm, lọc |
| `/inventory` | Tồn kho | Xem tồn kho theo warehouse, tìm kiếm, lọc |
| `/payments` | Thanh toán | Xem danh sách, tìm kiếm |
| `/settings` | Cài đặt | UI tĩnh |

---

## 5. Tính năng chưa làm

- **Tạo đơn bán hàng** — chưa có form tạo Order
- **Tạo payment** — chưa có form thêm Payment
- **Edit** bất kỳ entity nào — chưa có
- **Xóa customer** — chưa có
- **Tạo store** — nếu user mới chưa có store, app sẽ không load được dữ liệu

---

## 6. Khởi động dev server

```bash
cd apps/web
npm install
npm run dev
# Mở http://localhost:3000
```

Cần backend Spring Boot đang chạy ở `http://localhost:8080`.
Cấu hình URL backend trong `apps/web/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```
