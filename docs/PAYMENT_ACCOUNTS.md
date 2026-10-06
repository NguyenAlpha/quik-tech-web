# Subscription payment accounts

## Admin workflow

Open `/admin/payment-accounts`. Add a receiving account with a label, bank name,
account number, holder and optional branch. Adding does not select it automatically;
use **Use for new invoices** and confirm the old/new account details. Existing
invoices keep their destination. Reasons for changes are optional and recorded in
the activity log. Archived accounts remain under the Archived/All tabs and cannot
be edited or selected. Select a replacement before archiving the default account.

Forms send the last account version. A 409 closes the outdated dialog and refreshes
the list so the admin can reopen the latest record. Load errors offer retry.

## Checkout contract

`SubscriptionInvoice` includes nullable `paymentAccountId` and `bankInfo`. The
invoice mapper preserves them; `UpgradeResponse.bankInfo` is the same saved
destination. `getSubscriptionBankInfo(businessId, invoiceId)` reads saved details
when reopening an invoice. The no-invoice variant returns the current default or
null, and is used only to determine whether new payments are available.

When bank info is missing, show the support message; never substitute another
account. Admin review and both invoice-history screens expose the saved details.
The old hardcoded QR image has been removed from checkout because it could send
money to the wrong bank after a switch. The account number and reference remain
copyable. Dynamic bank QR generation is outside this change.

## Rollout

Backend migrations V11/V12 and the new endpoints must be deployed first. Refer to
backend `docs/api/PAYMENT_ACCOUNTS.md` for the one-time legacy import. On a fresh
installation without legacy settings, an admin adds/selects the first account on
the web. Nothing needs to be edited in ENV for later account changes.

No app run, build, automated checks or tests were performed for this feature, per
the user's instruction. No backend test code was added. The implementation is
committed for the user to run and evaluate locally.
