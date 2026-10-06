# Admin interface

The `/admin` area uses the same semantic theme tokens and UI primitives as the
merchant dashboard, with its own navigation, account menu and session handling.
Admin account actions use `admin_token` / `admin_user`; they must not use the
merchant `AuthContext` logout or require a selected store.

## Incremental delivery

1. Responsive shell, admin account header, mobile/collapsible navigation and
   theme-aware colors throughout the existing pages.
2. Overview with actionable pending invoices, revenue chart, plan distribution,
   loading, empty and retry states using the existing statistics API.
3. Consistent management tables, separate invoice/plan tabs, review dialogs and
   branded login. Preserve the current API contracts and EN/VI support.

Each step is checked and committed separately. Admin-specific labels live in
`lib/admin-copy.ts`; existing subscription labels remain in `lib/translations.ts`.

## Verification

Check TypeScript separately: the existing Next configuration skips type errors
during production builds. Check desktop/mobile navigation, light/dark themes,
EN/VI labels, empty/error states and admin-only logout. Test mutations with mocked
API responses rather than modifying production users, subscriptions or invoices.
