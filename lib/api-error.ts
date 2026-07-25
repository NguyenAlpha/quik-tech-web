import { ApiError } from './api'
import type { Translations } from './translations'

/**
 * Đổi lỗi API sang thông báo theo ngôn ngữ hiện tại.
 *
 * - Code đã có trong `t.errors` → dùng bản dịch (vd SUBSCRIPTION_LIMIT_EXCEEDED).
 * - Code chưa map (vd VALIDATION_ERROR mang chi tiết cụ thể) → giữ message từ server.
 * - Không phải ApiError (mạng/JS) → thông báo generic.
 *
 * Dùng thay cho `err.message` trực tiếp để tránh hiện message tiếng Anh thô.
 */
export function errorMessage(err: unknown, t: Translations): string {
  if (err instanceof ApiError) {
    return (t.errors as Record<string, string>)[err.code] ?? err.message
  }
  return t.errors.generic
}
