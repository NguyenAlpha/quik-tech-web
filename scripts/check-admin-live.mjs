import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

const base = process.env.ADMIN_API_URL || 'http://localhost:8080'
const username = process.env.ADMIN_USERNAME
const password = process.env.ADMIN_PASSWORD
const mutations = process.env.ADMIN_TEST_MUTATIONS === '1'
assert.ok(username && password, 'Set ADMIN_USERNAME and ADMIN_PASSWORD; credentials are never written to disk.')
if (mutations) {
  const url = new URL(base)
  assert.ok(url.hostname === 'localhost' && url.port === '8081', 'Mutation checks require the isolated localhost:8081 test backend.')
}

async function request(path, { token, method = 'GET', body, status = 200 } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  const result = await response.json().catch(() => null)
  assert.equal(response.status, status, `${method} ${path}: ${result?.error?.code || response.status}`)
  if (status >= 400) return result
  assert.equal(result?.success, true, `${method} ${path}: response envelope`)
  return result.data
}

const admin = await request('/api/auth/login', { method: 'POST', body: { usernameOrEmail: username, password } })
const token = admin.accessToken
await request('/api/admin/session', { status: 401 })
await request('/api/admin/session', { token: 'invalid-session', status: 401 })
const session = await request('/api/admin/session', { token })
assert.equal(session.username, admin.user.username)
const stats = await request('/api/admin/subscriptions/stats', { token })
assert.equal(typeof stats.totalBusinesses, 'number')
const businesses = await request('/api/businesses', { token })
assert.ok(Array.isArray(businesses))
if (businesses.length) {
  const detail = await request(`/api/admin/businesses/${businesses[0].id}`, { token })
  assert.equal(detail.business.id, businesses[0].id)
  assert.equal(detail.subscription.businessId, businesses[0].id)
  assert.ok(Array.isArray(detail.stores))
  const history = await request(`/api/businesses/${businesses[0].id}/subscription/invoices?page=0&size=20`, { token })
  assert.ok(history.content.every(invoice => invoice.businessId === businesses[0].id))
}
await request('/api/admin/businesses/9223372036854775807', { token, status: 404 })
const users = await request('/api/admin/users?page=0&size=1', { token })
assert.ok(Array.isArray(users.content))
const pending = await request('/api/admin/subscriptions/invoices/pending?page=0&size=1', { token })
assert.ok(Array.isArray(pending.content))
console.log('PASS: live admin login, session, missing/invalid token, statistics, businesses, users, pending invoices')

if (mutations) {
  const suffix = randomUUID().slice(0, 8)
  const account = { username: `admin-check-${suffix}`, email: `admin-check-${suffix}@example.invalid`, password: `Check-${randomUUID()}`, fullName: `ADMIN CHECK ${suffix}` }
  const owner = await request('/api/auth/register', { method: 'POST', body: account })
  try {
    await request('/api/admin/session', { token: owner.accessToken, status: 403 })
    await request('/api/admin/users', { token: owner.accessToken, status: 403 })
    const created = await request('/api/businesses/default', { token: owner.accessToken, method: 'POST', status: 201 })
    const businessId = created.business.id
    await request(`/api/admin/businesses/${businessId}`, { token: owner.accessToken, status: 403 })
    const detail = await request(`/api/admin/businesses/${businessId}`, { token })
    assert.equal(detail.business.id, businessId)
    assert.equal(detail.stores.length, 1)
    await request(`/api/businesses/${businessId}`, { token: owner.accessToken, method: 'PATCH', body: { name: `ADMIN CHECK ${suffix}`, address: '', phone: '', email: account.email } })
    const upgrade = await request(`/api/businesses/${businessId}/subscription/upgrade`, { token: owner.accessToken, method: 'POST', body: { plan: 'BASIC', billingCycle: 'MONTHLY' }, status: 201 })
    await request(`/api/admin/subscriptions/invoices/${upgrade.invoice.id}/confirm`, { token: owner.accessToken, method: 'POST', body: { adminNote: 'Unauthorized check' }, status: 403 })
    const paid = await request(`/api/admin/subscriptions/invoices/${upgrade.invoice.id}/confirm`, { token, method: 'POST', body: { adminNote: 'Isolated integration check' } })
    assert.equal(paid.status, 'PAID')
    const active = await request(`/api/admin/subscriptions/${businessId}`, { token })
    assert.equal(active.plan, 'BASIC')
    assert.equal(active.status, 'ACTIVE')
    await request(`/api/admin/subscriptions/invoices/${paid.id}/confirm`, { token, method: 'POST', body: {}, status: 400 })
    const next = await request(`/api/businesses/${businessId}/subscription/upgrade`, { token: owner.accessToken, method: 'POST', body: { plan: 'PRO', billingCycle: 'YEARLY' }, status: 201 })
    await request(`/api/admin/subscriptions/invoices/${next.invoice.id}/reject`, { token, method: 'POST', body: { adminNote: ' ' }, status: 400 })
    const rejected = await request(`/api/admin/subscriptions/invoices/${next.invoice.id}/reject`, { token, method: 'POST', body: { adminNote: 'Isolated rejection check' } })
    assert.equal(rejected.status, 'FAILED')
    assert.equal((await request(`/api/admin/subscriptions/${businessId}`, { token })).plan, 'BASIC')
    await request(`/api/admin/subscriptions/${businessId}/plan`, { token, method: 'PATCH', body: { plan: 'PRO' }, status: 400 })
    const pro = await request(`/api/admin/subscriptions/${businessId}/plan`, { token, method: 'PATCH', body: { plan: 'PRO', billingCycle: 'YEARLY' } })
    assert.equal(pro.plan, 'PRO')
    assert.ok(pro.expiresAt)
    const free = await request(`/api/admin/subscriptions/${businessId}/plan`, { token, method: 'PATCH', body: { plan: 'FREE', billingCycle: null } })
    assert.equal(free.expiresAt, null)
    assert.equal(free.billingCycle, null)
    await request(`/api/admin/users/${owner.user.id}/status`, { token, method: 'PATCH', body: { isActive: false } })
    await request('/api/auth/login', { method: 'POST', body: { usernameOrEmail: account.username, password: account.password }, status: 401 })
    await request(`/api/admin/users/${owner.user.id}/status`, { token, method: 'PATCH', body: { isActive: true } })
    await request('/api/auth/login', { method: 'POST', body: { usernameOrEmail: account.username, password: account.password } })
    console.log(`PASS: isolated business ${businessId}; owner denied admin access, confirm/reject, duplicate/invalid actions, Free/paid plans, user lock/unlock`)
  } finally {
    await request(`/api/admin/users/${owner.user.id}`, { token, method: 'DELETE' })
  }
  console.log('PASS: test account soft-deleted; fixture business/invoices remain only in the isolated database')
}

