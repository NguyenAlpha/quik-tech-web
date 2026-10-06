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

## Phase 4: live backend and administrator session

The login form verifies `/api/admin/session` before persisting the admin token.
The panel checks the same endpoint before mounting its pages. Permission/network
errors offer retry and admin-only logout; merchant session keys stay untouched.

Run `node scripts/check-admin-live.mjs` with `ADMIN_USERNAME`, `ADMIN_PASSWORD`
and optionally `ADMIN_API_URL` in the process environment. Default checks are
read-only. `ADMIN_TEST_MUTATIONS=1` is restricted to `localhost:8081`, the isolated
integration server with its own PostgreSQL database and Redis DB 15.

Live checks passed on 2026-10-06, including invoice confirm/reject and validation,
plan changes, ordinary-user 403, missing/invalid token 401 and user lock/unlock/
deletion. No real business records were mutated by these checks.

Chromium also verified real login, the session gate, navigation and expired-token
redirection while preserving merchant session storage.

## Phase 5: business detail

Business names link to `/admin/businesses/{id}`. The page shows contact details,
subscription limits, business-scoped stores and invoice history. `tab` and `page`
are URL parameters. The adjustment link opens
`/admin/subscriptions?tab=override&businessId={id}` with the business selected.
Plan badges in the business list retain the existing quick adjustment dialog.

The adjustment form uses a searchable business picker. Type a business name to
filter the loaded business list; matching ignores case and Vietnamese accents.
Each option also shows its ID to distinguish duplicate names. Keyboard selection,
no-results messages and EN/VI labels are supported. Choosing a result keeps
`businessId` in the URL, including preselection from the business detail page.
Validated with TypeScript and Chromium fixtures: unaccented/case-insensitive name
search, keyboard selection, empty results, duplicate names, URL/reload and 390px VI layout.

The aggregate detail endpoint requires the Phase 5 backend. Invoice history uses
the existing business endpoint, with loading/empty/retry states and pagination.

Phase 5 checks passed: TypeScript, production build, live aggregate/404/403 and
business-scoped invoice history; Chromium tabs/reload, preselected adjustment,
390px layout without page overflow and no JavaScript errors.

## Phase 6: invoice operations

Subscriptions has pending, history and adjustment tabs. History searches business
names, numeric business/invoice IDs and transfer references, with status filtering.
`tab`, `q`, `status` and zero-based `page` are preserved in the URL; submitting a
search or changing status resets pagination. Requests ignore obsolete responses.

The navigation badge and pending tab count refresh after confirm/reject, manual
refresh and returning to the browser tab. A failed count request hides the badge
instead of showing a stale count. Confirming also refreshes a selected subscription.

Phase 6 checks passed: TypeScript/build, real API filters, literal wildcard,
page boundaries, invalid parameter 400 and normal-user 403. An isolated live
browser check confirmed payment, badge refresh, search/status URL restoration
and mobile layout; production business records were not mutated.

## Phase 7: administrator activity

`/admin/audit` lists plan adjustments, invoice confirmation/rejection and account
status/deletion changes. Action, business and actor filters are URL parameters;
older entries use a cursor (`beforeId`), with a button to return to the latest.
The detail dialog shows reason and changed fields side by side, with EN/VI labels.

Plan adjustment and account dialogs accept an optional 500-character reason.
Invoice actions keep the existing note/rejection reason. Requests remain compatible
with older callers that omit a reason. Activity starts after the backend update;
previous activity is not reconstructed. Backend audit snapshots use an explicit
field allowlist and exclude passwords/tokens.

Phase 7 checks passed: TypeScript and production build; live API actor/reason/
before-after, cursor pagination, authorization, failed actions excluded and
concurrent confirmation. Chromium exercised plan adjustment, lock and delete
reasons, the comparison dialog at 390px, filter restoration and EN/VI. All these
mutations used isolated test records. The backend rollback script verified that
an audit insert failure also rolls back the subscription change.
