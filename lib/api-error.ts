import { ApiError } from './api'
import type { Translations } from './translations'

/**
 * Đổi lỗi API sang thông báo theo ngôn ngữ hiện tại.
 *
 * - Code đã có trong `t.errors` → dùng bản dịch (vd SUBSCRIPTION_LIMIT_EXCEEDED). Mọi code trong
 *   `API_ERROR_CODES` đều phải có bản dịch — `api-error.test.ts` kiểm tra.
 * - Code chưa map → `fallback`, không dùng message từ server (tiếng Anh, dành cho developer).
 * - Không phải ApiError (mạng/JS) → `fallback`.
 *
 * Dùng thay cho `err.message` trực tiếp để tránh hiện message tiếng Anh thô.
 */
export function errorMessage(err: unknown, t: Translations, fallback: string = t.errors.generic): string {
  if (err instanceof ApiError) {
    const seconds = err.retryAfterSeconds
    if (err.code === 'RATE_LIMIT_EXCEEDED' && seconds !== undefined && seconds > 0) {
      return t.errors.RATE_LIMIT_RETRY_AFTER.replace('{seconds}', String(seconds))
    }
    const translated = (t.errors as Record<string, string>)[err.code]
    if (translated !== undefined) return translated
    console.warn(`Missing translation for API error code ${err.code}: ${err.message}`)
  }
  return fallback
}
