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

### Optional account QR

The Add/Edit dialog accepts PNG, JPG and WebP up to 5 MB / 4096 × 4096 pixels.
Upload displays a preview; choose another file to replace it or use **Remove QR
image**. WebP is converted to PNG before upload. The server decodes and normalizes
images to PNG without resizing; the normalized image must also fit within 5 MB.
Save waits for upload to finish. Upload failure retains the previously selected
image; cancelling the dialog does not modify the account.

Before saving an account with QR, scan the preview and tick the confirmation that
its bank, account number and holder match the form. Changing receiving details or
replacing the image clears confirmation. Use an account QR without a fixed amount
or payment reference. Confirmation is a human check; the app does not parse or
validate banking QR payloads automatically.

Account cards and the account-switch confirmation display the QR. Images are
optional; accounts without them continue to support manual bank transfers.

## Checkout contract

`SubscriptionInvoice` includes nullable `paymentAccountId` and `bankInfo`. The
invoice mapper preserves them; `UpgradeResponse.bankInfo` is the same saved
destination. `getSubscriptionBankInfo(businessId, invoiceId)` reads saved details
when reopening an invoice. The no-invoice variant returns the current default or
null, and is used only to determine whether new payments are available.

When bank info is missing, show the support message; never substitute another
account. Admin review and both invoice-history screens expose the saved details.
The old hardcoded QR image has been removed from checkout because it could send
money to the wrong bank after a switch. Instead, shared `PaymentBankDetails` shows
the uploaded QR saved with that invoice in checkout, invoice history and admin
review. The account number and reference remain copyable. The payment hint asks
customers to verify the recipient and enter the exact invoice amount/reference
after scanning. Dynamic bank QR generation is outside this change.

`BankTransferInfo.qrImageUrl` is nullable. Images load with the appropriate admin
or merchant Bearer token, then display through a temporary blob URL (revoked on
cleanup). Merchant image loading uses the existing token refresh flow. Only known
QR API paths are accepted. Load errors provide retry and retain text bank details
for manual transfer; no fallback to another account or QR is used.

Admin upload is `POST /api/admin/payment-accounts/qr`, with raw PNG/JPEG bytes and
the corresponding image Content-Type. Save sends `qrImageKey` and `qrConfirmed`;
null key removes QR. Invoice QR URLs use
`/api/businesses/{businessId}/subscription/invoices/{invoiceId}/qr`. Replacing or
removing an account image leaves earlier invoices unchanged, including invoices
originally created without a QR.

## Rollout

The receiving-account schema is part of the backend's V2 development baseline.
Recreate an existing development database and clean/rebuild the backend before
starting it; the former V11/V12 migrations and legacy import have been removed.
Refer to backend `docs/api/PAYMENT_ACCOUNTS.md` for setup details. A fresh database
has no receiving accounts: an admin adds/selects the first account on the web.
Account setup and all later changes use the UI, with no ENV configuration.

The V2 baseline now also contains nullable account/invoice QR storage keys. Reset
the development database for this baseline update. Keep the backend QR storage
directory persistent and backed up with the database; see the backend document
for `PAYMENT_QR_STORAGE_PATH`. Old images and cancelled uploads are retained so
historical invoice images are not accidentally removed. No reset or cleanup is
performed automatically by this feature.

No app run, build, automated checks or tests were performed for this feature, per
the user's instruction. No backend test code was added. The implementation is
committed for the user to run and evaluate locally.
