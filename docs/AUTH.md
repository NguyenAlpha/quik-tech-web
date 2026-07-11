# Auth — Xác Thực & Phân Quyền

## 1. Tổng quan flow

```
User nhập email + password
    │
    ▼
POST /api/auth/login
    │
    ▼
Spring Boot trả về AuthResponse:
  { accessToken, tokenType, expiresIn, user, storeMemberships }
    │
    ├─ accessToken  → lưu localStorage("auth_token") + cookie("auth_token")
    ├─ user         → lưu localStorage("auth_user")
    ├─ memberships  → lưu localStorage("auth_memberships")
    └─ storeId      → lưu localStorage("auth_store_id")   ← dùng cho mọi API call
    │
    ▼
router.push('/')  →  middleware kiểm tra cookie → cho vào dashboard
```

---

## 2. AuthResponse — Dữ liệu backend trả về

```ts
interface AuthResponse {
  accessToken: string        // JWT token
  tokenType: string          // "Bearer"
  expiresIn: number          // Giây hết hạn
  user: AuthUser
  storeMemberships: StoreMembership[]
}

interface AuthUser {
  id: number
  publicId: string
  username: string
  email: string
  fullName: string
  phone: string | null
  isActive: boolean
}

interface StoreMembership {
  id: number
  storeId: number   // ← ID dùng trong URL /api/stores/{storeId}/...
  role: string      // "OWNER", "STAFF", ...
}
```

---

## 3. AuthContext (lib/auth-context.tsx)

Quản lý toàn bộ trạng thái auth qua React Context. Wrap toàn app trong `app/layout.tsx`.

### State
```ts
user: AuthUser | null          // Thông tin user đang đăng nhập
token: string | null           // JWT token
storeId: number | null         // Store ID đang hoạt động
memberships: StoreMembership[] // Danh sách store user là thành viên
isLoading: boolean             // true trong khi đọc localStorage lần đầu
```

### Hàm login()
```ts
login(token: string, user: AuthUser, memberships: StoreMembership[]) => void
```

Gọi sau khi backend xác thực thành công. Tự động:
1. Lưu token, user, memberships vào `localStorage`
2. Lưu `memberships[0].storeId` vào `localStorage("auth_store_id")`
3. Set cookie `auth_token` (để middleware đọc được phía server)
4. Cập nhật React state

### Hàm logout()
```ts
logout() => void
```

1. Xóa tất cả key khỏi `localStorage`
2. Xóa cookie `auth_token`
3. Reset React state về null
4. Redirect về `/login`

### Hook useAuth()
```tsx
import { useAuth } from '@/lib/auth-context'

const { user, token, storeId, memberships, isLoading, login, logout } = useAuth()

// Ví dụ: hiển thị tên user trong header
<span>{user?.fullName}</span>

// Ví dụ: nút logout
<button onClick={logout}>Đăng xuất</button>
```

---

## 4. Lưu trữ Token — localStorage vs Cookie

Token được lưu ở **hai nơi** với mục đích khác nhau:

| Nơi lưu | Key | Mục đích |
|:---|:---|:---|
| `localStorage` | `auth_token` | Dùng trong `apiFetch()` để gắn vào header `Authorization` |
| `localStorage` | `auth_user` | Lưu thông tin user (JSON) |
| `localStorage` | `auth_memberships` | Lưu danh sách store memberships |
| `localStorage` | `auth_store_id` | ID store hiện tại — dùng trong `storeUrl()` |
| Cookie | `auth_token` | Cho `middleware.ts` đọc phía server (middleware không đọc được localStorage) |

Cookie config:
```ts
document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
// max-age = 7 ngày
```

---

## 5. Middleware — Bảo vệ Route (middleware.ts)

Chạy **trước mỗi request** trên server — đọc cookie `auth_token`:

```ts
const publicRoutes = ['/login', '/register']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl

  // Đã login + vào trang login → redirect về dashboard
  if (publicRoutes.includes(pathname)) {
    if (token) return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.next()
  }

  // Chưa login + vào trang cần auth → redirect về /login
  if (!token) return NextResponse.redirect(new URL('/login', request.url))
  return NextResponse.next()
}
```

Middleware áp dụng cho tất cả route, **trừ**:
- `/api/*` — API routes của Next.js
- `/_next/*` — Static assets
- `/favicon.ico`, `/icon.*`, `/apple-icon.*`

---

## 6. Trang Login (/login)

File: `app/(auth)/login/page.tsx`

```
Form: email + password
  │
  ▼ onSubmit
loginUser({ email, password })    ← lib/api.ts
  │
  ▼ AuthResponse
login(accessToken, user, storeMemberships)   ← AuthContext
  │
  ▼
router.push('/')
```

Lỗi từ backend (sai mật khẩu, không tìm thấy user...) được bắt và hiển thị ngay
trên form qua `error` state.

---

## 7. Trang Register (/register)

File: `app/(auth)/register/page.tsx`

Fields: `fullName`, `username`, `email`, `password`, `confirmPassword`

Validate client-side:
- `password === confirmPassword`
- `password.length >= 6`

```
registerUser({ fullName, username, email, password })   ← lib/api.ts
  │
  ▼ AuthResponse (backend tự login sau register)
login(accessToken, user, storeMemberships)
  │
  ▼
router.push('/')
```

---

## 8. Trường hợp user chưa có store

Nếu `storeMemberships` rỗng sau khi đăng nhập (user mới, chưa được thêm vào store nào),
thì `storeId = null` và mọi API call sẽ throw `Error("No store selected")`.

**Chưa có xử lý** cho trường hợp này — cần làm thêm luồng tạo store hoặc hiển thị
trang empty state phù hợp.
