# Client Area Audit

Date: 2026-05-11

Goal: keep the Znet client area small and payment-moderation friendly, with the least possible intervention in FOSSBilling core. Prefer theme/templates and route-level redirects over schema/runtime changes.

## User-Facing Client Surface

### Keep And Polish

- `/client` and `/` while logged in: client dashboard.
- `/client/profile`: simplified profile page.
- `/order/service`: active services.
- `/order/service/manage/:id`: service details, subscription link, renewals.
- `/invoice`: invoices list and filters.
- `/invoice/:hash`: invoice payment page.
- `/invoice/thank-you/:hash`: payment result page.
- `/client/balance`: wallet and top-up flow.
- `/orderbutton?checkout=1`: checkout/cart flow.

### Redirected Or Intentionally Hidden

- `/cart`: redirects to `/#plans`; the real checkout surface is `orderbutton`.
- `/order`: redirects to `/#plans`; direct generic product listing is not part of the public UX.
- `/pricing`: redirects to `/#plans`.
- `/me`: redirects to `/client/profile`.
- `/balance`: redirects to `/client/balance`.
- `/support`, `/support/ticket/:id`, `/support/contact-us`, `/support/kb*`, and `/contact-us`: support is routed through `/contacts`.
- `/news`, `/blog`, old embed/custom/demo pages: removed from public navigation or redirected.

### Still Reachable By Direct URL

These are not in the visible Znet navigation, but still exist if a logged-in user opens the URL directly:

- `/email` and `/emails`: transactional email history.
- `/service` and `/service/manage/:id`: legacy aliases for service pages.

Support tickets, cancellation requests, and upgrade requests are not exposed as self-service flows. Users are sent to `/contacts` instead.

## Current Simplification Pass

- Dashboard now acts as a calm start screen: connection status, payment summary, and support entry.
- Global client navigation is reduced to four primary areas: overview, connection, payment, profile.
- Device/app setup moved from the dashboard to `/order/service/manage/:id`, so users configure the exact service they paid for.
- Service page now separates the two real connection paths:
  - Android: Znet APK, short setup guide, device token, Auto ON/OFF note.
  - iPhone: compatible VPN client through the subscription link; no Znet iPhone app yet.
- Order numbers, sync timestamps, addons, and service internals are hidden under "Technical details".

## Billing Interactions

### Checkout

Flow:

1. Public pricing card opens order/checkout.
2. Product gets added to cart through `api/guest/cart/add_item`.
3. User logs in or creates account inside `orderbutton`.
4. Checkout calls `api/client/cart/checkout`.
5. FOSSBilling generates invoice and redirects to invoice/payment.

Current change: `orderbutton` now uses the Znet shell instead of the old public layout, and internal product-selection links stay inside `orderbutton`.

### Invoice Payment

Flow:

1. `/invoice/:hash` shows enabled payment gateways.
2. Selecting a gateway posts to `api/guest/invoice/payment`.
3. Gateway returns through FOSSBilling banklink/thank-you routes.

Antilopay integration should fit here as a normal FOSSBilling payment gateway.

### Wallet Top-Up

FOSSBilling already supports user balance.

Flow:

1. `/client/balance` posts amount to `api/client/invoice/funds_invoice`.
2. FOSSBilling creates an add-funds invoice.
3. User pays invoice through the same gateway flow.
4. Paid invoice credits the user balance.
5. Future invoices can use available balance/credits.

Current change: wallet is available from the dashboard payment card and the balance page is restyled for Znet.

## Open Product Questions

- Internal support tickets: closed for the client UI; `/contacts` is the single support entry point.
- Do we want email history available to users?
- Should balance be an optional advanced feature or a primary payment option?
- Service cancellation/upgrade: support-only process through `/contacts`.
- iPhone path: temporary manual setup through the subscription link; decide later whether to build a native iOS app or keep iPhone as bring-your-own-client.

## Next Audit Pass

- Logged-in live walkthrough with a real test account:
  - signup
  - checkout
  - invoice payment selection
  - wallet top-up invoice
  - service page/subscription link
  - Android APK/token activation
  - iPhone manual subscription-link path
  - profile update
- Review `/order/service/manage/:id` actions: renew, app token, subscription copy, support handoff.
- Live-check support redirects: `/support`, `/support/ticket/:id`, `/support/kb`.
- Review payment gateway copy once Antilopay test credentials are installed.
