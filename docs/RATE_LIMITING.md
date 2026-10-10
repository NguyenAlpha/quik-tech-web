# Xử lý rate limit ở frontend

Backend trả HTTP 429 và mã `RATE_LIMIT_EXCEEDED` khi hết quota. Frontend không
tự gửi lại request 429, kể cả thao tác ghi dữ liệu, import hay export.

## Hợp đồng lỗi

`lib/api.ts` chuẩn hóa lỗi cho API JSON, admin, login/register, import và export:

- `ApiError.code`: mã lỗi backend; HTTP 429 luôn được nhận diện là `RATE_LIMIT_EXCEEDED`.
- `ApiError.status`: HTTP status.
- `ApiError.retryAt`: thời điểm được thử lại, lấy từ `Retry-After`.
- `ApiError.retryAfterSeconds`: số giây còn lại, tính từ thời điểm hiện tại.

`Retry-After` chấp nhận số giây nguyên không âm hoặc HTTP-date. Header thiếu/sai
thì chỉ hiện thông báo chung, không tự đoán thời gian khóa. Body 429 là HTML hoặc
JSON không hợp lệ vẫn được nhận diện đúng theo HTTP status. Backend phải expose
header này qua CORS khi frontend và backend khác origin.

Page dùng `errorMessage(err, t, fallback?)` để có thông báo tiếng Việt/Anh, ví dụ:
“Quá nhiều yêu cầu. Vui lòng thử lại sau 30 giây.” Các lỗi nghiệp vụ đặc biệt như
không được xóa sản phẩm còn tồn kho vẫn giữ thông báo riêng.

## Refresh và phiên đăng nhập

`authenticatedFetch()` dùng chung cho JSON, multipart và download:

1. Gửi request với access token hiện tại.
2. Khi nhận 401, dùng token mới nếu một request khác vừa refresh xong; nếu chưa,
   gọi refresh. Các request đồng thời trong cùng tab dùng chung một refresh promise.
3. Refresh thành công thì lưu token mới và thử lại request gốc tối đa một lần.
4. Không có refresh token, refresh trả 401, hoặc request sau refresh vẫn trả 401
   thì xóa phiên và chuyển sang login.
5. Refresh trả 429, lỗi 5xx, mất mạng hoặc response lỗi thì giữ phiên và đưa lỗi
   về caller. Refresh 429 có thời gian chờ hợp lệ sẽ chặn các lần refresh tiếp
   theo trong cùng tab cho đến deadline, gắn với refresh token đó.

Trong lúc chờ, các request API khác vẫn có thể được gửi; nếu chúng nhận 401 thì
không phát sinh thêm request refresh. Hết thời gian chờ không tự gửi lại thao tác:
người dùng cần thử lại. Không có cơ chế đồng bộ refresh giữa nhiều tab.

## Giao diện

`useRateLimitCooldown()` quản lý đếm ngược cho nút login, register, admin login,
import sản phẩm và export orders/inventory. Nút bị vô hiệu hóa khi request đang
chạy hoặc đang chờ quota. Đồng hồ dùng deadline thực tế, cập nhật mỗi giây và dọn
timer khi unmount. Cooldown nút chỉ tồn tại trong màn hình đang mở; chuyển trang
hoặc reload có thể bỏ trạng thái UI này, backend vẫn thực thi quota.

Các màn hình nghiệp vụ/admin dùng thông báo lỗi chung đã dịch. Không khóa toàn
bộ ứng dụng khi một thao tác bị limit, vì backend có nhiều quota khác nhau và
response hiện không chỉ rõ quota nào đã chặn request.

## Kiểm tra

```powershell
node node_modules/typescript/bin/tsc --noEmit --incremental false
pnpm build
```

Build Next.js hiện cấu hình `ignoreBuildErrors`, vì vậy cần chạy TypeScript riêng.
Project chưa cấu hình test runner; bộ kiểm tra mô phỏng fetch chạy trong quá trình
triển khai đã kiểm tra 429 JSON/HTML, Retry-After hợp lệ/sai, refresh 401/429/5xx,
mất mạng, single-flight, 401 đến muộn, download, multipart và bản dịch.

Khi kiểm tra thủ công với backend và Redis thật:

- Hạ quota ở môi trường test, tăng `RATE_LIMIT_CONFIG_VERSION` khi đổi quota.
- Đăng nhập/import/export đến khi nhận 429; kiểm tra thông báo, nút chờ và không
  có request tự gửi lại trong Network panel.
- Để access token hết hạn và làm refresh nhận 429: localStorage/cookie vẫn còn,
  không chuyển sang login; sau thời gian chờ bấm lại để tiếp tục.
- Kiểm tra refresh token thực sự hết hạn/thu hồi vẫn đưa người dùng về login.
- Kiểm tra hai request 401 đồng thời chỉ gọi refresh một lần trong cùng tab.
