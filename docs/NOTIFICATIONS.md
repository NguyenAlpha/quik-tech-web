# Notifications

The dashboard bell and `/notifications` share a notification provider scoped to
the signed-in user, business and selected store. A context switch remounts the
provider and its consumers; pending reads are aborted and stale responses cannot
populate the new context. Requests include the captured store ID explicitly and
use the merchant API/token refresh/error handling, never the admin session.

## UI

- Bell: real unread badge (99+ cap), popover with 8 recent entries, All/Unread tabs,
  mark-one/read-all actions, and a link to the full history.
- History: sidebar entry, 20 events per page with Load more, All/Unread filters.
  Refresh reloads the first page. Reading an event refreshes the current list.
- Current low-stock and pending-invoice counts live in a separate Needs attention
  area; reading notifications does not resolve inventory/payment tasks.
- Each event shows a translated type, subject, recorded detail, timestamp and
  resolved state. It links to the related inventory entry or subscription invoice.
- Initial loading, empty/unread-empty, summary errors, list errors, mutation errors
  and retry are distinct. A failed summary hides its unread badge rather than
  presenting a stale count as current. Existing history may remain while retrying.
- EN/VI copy lives in `lib/notification-copy.ts`; semantic theme tokens support
  light/dark mode and the popover fits mobile widths.

Summary refreshes every 60 seconds while the tab is visible, on focus, opening the
bell and after read mutations. A 429 backs summary polling off using Retry-After
(60 seconds if absent). History is fetched on opening/filter change/read actions
or manual refresh; background summary polling does not reset loaded history pages.
Mark all sends the summary's `latestId`, leaving newer notifications unread.
Read state persists on the server across reloads/devices and is independent per
user. Reading a business event applies across that user's stores in the business.

Inventory events are store-specific. Subscription events and pending counts are
OWNER-only, enforced by the backend; other roles cannot read those events by ID.
The server currently allows authorized members to read past events in their scope.
Resolved alerts remain in All, treated as read and excluded from Unread.

## Destination pages

`/inventory?item={inventoryPublicId}` filters the table to the captured inventory
entry, with a clear-filter button. A deleted/missing entry has an explicit message.
The live quantity is displayed in inventory, while notification details preserve
the original detection values.

`/subscription?invoiceId={id}` opens a read-only detail dialog loaded by ID. This
works for invoices outside the latest 10 displayed in history. Missing/inaccessible
invoices show a retryable error; there is no fallback to another invoice. Closing
removes the query. Notification targets are restricted to these internal paths.

## Backend and rollout

Types: LOW_STOCK, INVOICE_PAID, INVOICE_FAILED (including automatic cancellation),
SUBSCRIPTION_EXPIRING (within 7 days), SUBSCRIPTION_EXPIRED. A backend collector
materializes committed state every 60 seconds; typical visibility can take two
polling intervals. No browser push or realtime socket is required. Initial startup
imports existing terminal invoices and current alerts. Short stock transitions
between collector runs are not captured; repeated polling does not create duplicate
events. A new stock episode requires the collector to observe recovery first.

The existing V8 migration now defines notifications and per-user read receipts.
Reset the disposable development database for the changed baseline, then start the
updated backend before the web. No reset is performed by this feature. See backend
`docs/api/NOTIFICATIONS.md` for API contracts, scopes, event keys and configuration.
There is no automatic notification retention cleanup in this version.

No backend test code was added. No applications, builds, automated checks or tests
were run, as requested. Code/docs are supplied for the user to run locally.
