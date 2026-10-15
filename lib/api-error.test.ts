import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from './api'
import { API_ERROR_CODES } from './api-error-codes'
import { errorMessage } from './api-error'
import { translations, type Language, type Translations } from './translations'

// Enum ErrorCode của backend — chỉ có khi chạy trong monorepo (CI/Vercel của repo web không có thư mục api)
const BACKEND_ERROR_CODE = fileURLToPath(new URL(
  '../../../api/src/main/java/com/quiktech/pos/dto/response/common/ErrorCode.java', import.meta.url))

describe('API error translations', () => {
  it.each(['en', 'vi'] as const)('translates every API error code in %s', language => {
    const errors = translations[language].errors as Record<string, string>
    const missing = API_ERROR_CODES.filter(code => !errors[code]?.trim())
    expect(missing).toEqual([])
  })

  it('has the same error keys in every language', () => {
    expect(Object.keys(translations.vi.errors).sort()).toEqual(Object.keys(translations.en.errors).sort())
  })

  it.skipIf(!existsSync(BACKEND_ERROR_CODE))('lists every backend ErrorCode', () => {
    const body = readFileSync(BACKEND_ERROR_CODE, 'utf8').replace(/\/\/.*$/gm, '')
    const enumBody = body.slice(body.indexOf('{') + 1, body.lastIndexOf('}'))
    const backendCodes = enumBody.match(/\b[A-Z][A-Z0-9_]*\b/g) ?? []
    expect(backendCodes.length).toBeGreaterThan(0)
    expect(backendCodes.filter(code => !(API_ERROR_CODES as readonly string[]).includes(code))).toEqual([])
  })
})

describe('errorMessage', () => {
  const t = translations['vi' as Language] as Translations // giống language-context.tsx

  it('uses the translation for a known code', () => {
    expect(errorMessage(new ApiError('PRODUCT_SKU_TAKEN', 'SKU already exists'), t)).toBe(t.errors.PRODUCT_SKU_TAKEN)
  })

  it('never shows the raw server message for an unknown code', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(errorMessage(new ApiError('SOMETHING_NEW', 'Raw English detail'), t)).toBe(t.errors.generic)
    expect(errorMessage(new ApiError('SOMETHING_NEW', 'Raw English detail'), t, 'Fallback')).toBe('Fallback')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('includes the wait time for rate limits', () => {
    const err = new ApiError('RATE_LIMIT_EXCEEDED', 'Too many requests', 429, Date.now() + 30_000)
    expect(errorMessage(err, t)).toBe(t.errors.RATE_LIMIT_RETRY_AFTER.replace('{seconds}', '30'))
  })

  it('falls back for non-API errors', () => {
    expect(errorMessage(new TypeError('Failed to fetch'), t)).toBe(t.errors.generic)
  })
})
