# Admin interface

The `/admin` area uses the same semantic theme tokens and UI primitives as the
merchant dashboard, with its own navigation, account menu and session handling.
Admin account actions use `admin_token` / `admin_user`; they must not use the
merchant `AuthContext` logout or require a selected store.

## Incremental delivery

- [x] Responsive shell, admin account header, mobile/collapsible navigation and
   theme-aware colors throughout the existing pages.
- [x] Overview with actionable pending invoices, revenue chart, plan distribution,
   loading, empty and retry states using the existing statistics API.
- [x] Consistent management tables, separate invoice/plan tabs, review dialogs and
   branded login. Preserve the current API contracts and EN/VI support.

Each step is checked and committed separately. Admin-specific labels live in
`lib/admin-copy.ts`; existing subscription labels remain in `lib/translations.ts`.

## Verification

Check TypeScript separately: the existing Next configuration skips type errors
during production builds. Check desktop/mobile navigation, light/dark themes,
EN/VI labels, empty/error states and admin-only logout. Test mutations with mocked
API responses rather than modifying production users, subscriptions or invoices.

Validated on 2026-10-06:

- `npx tsc --noEmit --incremental false` and `npm run build`.
- Chromium: desktop collapse, mobile drawer navigation, EN/VI, light/dark and
  logout preserving the merchant session.
- Overview: six revenue bars, pending invoice link, failed request and retry,
  empty revenue/plans, and no horizontal page overflow at 390px.
- Users: debounced search resets pagination, status confirmation before sending
  a mutation, deletion and list refresh, failed request and retry.
- Businesses: keyboard access to details and Free plan payload with no paid cycle.
- Subscriptions: business names in review dialogs, confirm note, required reject
  reason, paid plan/cycle payload and responsive adjustment form.
- Login: password visibility, rate-limit cooldown and successful admin session.
- Local production: 320px invoice table/dialog, long transfer reference wrapping,
  invoice retry, and subscription retry with plan changes disabled until loaded.

Browser checks used synthetic fixtures and intercepted API requests. Live backend
integration and production data were not exercised. The local production check
stubbed the existing Vercel Analytics script: its endpoint returns HTML on the
local Next server, which otherwise produces an unrelated script parse error.
