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
export function errorMessage(err: unknown, t: Translations, fallback: string = t.errors.generic): string {
  if (err instanceof ApiError) {
    const seconds = err.retryAfterSeconds
    if (err.code === 'RATE_LIMIT_EXCEEDED' && seconds !== undefined && seconds > 0) {
      return t.errors.RATE_LIMIT_RETRY_AFTER.replace('{seconds}', String(seconds))
    }
    return (t.errors as Record<string, string>)[err.code] ?? err.message
  }
  return fallback
}
