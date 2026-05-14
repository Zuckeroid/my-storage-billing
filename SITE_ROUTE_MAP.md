# Znet Site Route Map

Date: 2026-05-14

Purpose: freeze the site structure before the next design pass. This map separates canonical user routes from legacy FOSSBilling routes and keeps the work ordered: first desktop/public and client flows, then one clean mobile pass.

Related documents:

- `PUBLIC_SITE_AUDIT.md` - public pages and moderation risks.
- `CLIENT_AREA_AUDIT.md` - client area scope and billing interactions.
- `ANTILOPAY_MODERATION_CHECKLIST.md` - payment provider readiness checklist.

## Template Model

Product-level templates:

| Type | Technical base | Scope | Rule |
| --- | --- | --- | --- |
| Home | `layout_public` + `znet_homepage.html.twig` | Guest `/` only | Immersive marketing/pricing page. Keep separate from billing shell. |
| Public | `layout_default.html.twig` without logged-in client context | Auth, legal, checkout, contacts, payment info | One shared shell, one header, one card/panel language. |
| Client | `layout_default.html.twig` with logged-in client context | Dashboard, services, payments, balance, profile | Minimal dashboard. Hide billing internals unless they help the user. |

Service exceptions:

- `layout_blank.html.twig`, PDF, print, API, admin, webhooks, and payment callback routes are not part of visual redesign.
- Mobile styles should be treated as a single later pass, not page-by-page patches.

## Canonical Route Map

| Route | Type | Template / module | Current role | Decision |
| --- | --- | --- | --- | --- |
| `/` guest | Home | `Index` override in `src/themes/huraga/html/mod_index_dashboard.html.twig` -> `znet_homepage.html.twig` | Main public page with plans | Canonical. Keep as the only marketing home. |
| `/` logged in, `/client` | Client | `mod_index_dashboard.html.twig` + `layout_default` | "Ваш Znet" dashboard | Canonical. Keep simple: connection, balance, support. Payment choice lives on `/invoice#plans`. |
| `/orderbutton` | Public / Client | `Orderbutton` | Technical order/checkout fallback | Keep as a public fallback route. Logged-in users redirect to `/invoice#plans`. Primary client plan choice lives inside `/invoice`. |
| `/orderbutton/js` | Service | `Orderbutton` | Widget script endpoint | Keep only if core checkout needs it. No design work. |
| `/login` | Public | `Page/mod_page_login.html.twig` | Full login fallback | Keep as fallback, but primary login UX is the header auth panel. |
| `/signup` | Public | `Page/mod_page_signup.html.twig` | Full registration fallback | Keep as fallback, align with header auth panel. Check legal links. |
| `/password-reset` | Public | `Page/mod_page_password-reset.html.twig` | Full reset fallback | Keep. |
| `/reset-password-confirm/:hash`, `/client/reset-password-confirm/:hash` | Public / Client | Client reset route | Password reset confirmation | Keep. |
| `/payment` | Public | `Page/mod_page_payment.html.twig` | Payment/moderation page | Keep. Needs one shell/copy pass with other public pages. |
| `/about-us` | Public | `Page/mod_page_about-us.html.twig` | Service/company page | Keep. Needs final company details and shell alignment. |
| `/contacts` | Public | `Page/mod_page_contacts.html.twig` | Single support/contact entry | Canonical support route. All user-facing support should lead here. |
| `/offer` | Public | `Page/mod_page_offer.html.twig` | Public offer | Keep. Fill final legal details at the end. |
| `/tos` | Public | `Page/mod_page_tos.html.twig` | User agreement | Keep. |
| `/privacy-policy` | Public | `Page/mod_page_privacy-policy.html.twig` | Privacy policy | Keep. |
| `/refund-policy` | Public | `Page/mod_page_refund-policy.html.twig` | Refund policy | Keep. |
| `/client/profile` | Client | `Client/mod_client_profile.html.twig` | Profile details | Canonical. Already close to the target shell. |
| `/client/balance`, `/balance` | Client | `Client/mod_client_balance.html.twig`, redirect alias | Wallet/top-up | Keep if balance remains part of product. Final decision after Antilopay test flow. |
| `/invoice` | Client | `Invoice/mod_invoice_index.html.twig` | Payment hub: plan choice, plan payment, payment history | Canonical. Invoices and cart remain billing internals; UI should say plans/payments/history. Canceled invoices stay hidden. |
| `/invoice/:hash` | Public-by-hash / Client | `Invoice/mod_invoice_invoice.html.twig` | Payment page, backed by an invoice | Redesigned into the Znet shell. Payment gateway links go directly to banklink with subscriptions disabled. |
| `/invoice/thank-you/:hash` | Public-by-hash / Client | `Invoice/mod_invoice_thankyou.html.twig` | Payment result | Keep. Needs style check after invoice redesign. |
| `/invoice/banklink/:hash/:id`, `/banklink/:hash/:id` | Service | `Invoice` | Payment gateway transition | Keep as service route. No decorative work unless visible to users. |
| `/invoice/print/:hash`, `/invoice/pdf/:hash` | Service | `Invoice` | Print/PDF export | Keep as technical output. |
| `/order/service`, `/service` | Client | `Order/mod_order_list.html.twig`, redirect alias | Connection list | Canonical client connection list. No billing table UX. |
| `/order/service/manage/:id`, `/service/manage/:id` | Client | `Order/mod_order_manage.html.twig`, redirect alias | Connection/instructions | Canonical service detail. Keep Android/iPhone paths simple. |
| `/order`, `/order/:id`, `/order/:slug` | Legacy public order | `Order` | Old product/order flow | Do not use as primary UX. Redirect or hide once `/orderbutton` is stable. |
| `/support`, `/support/*`, `/support/kb*`, `/contact-us` | Legacy support | `Support`, redirect aliases | Tickets/KB/contact legacy pages | Non-canonical. Route users to `/contacts`. |
| `/news`, `/news/:slug`, `/blog*` | Legacy content | `News`, redirect aliases | FOSSBilling demo/news | Non-canonical. Keep redirected/hidden. |
| `/email`, `/emails` | Legacy client utility | `Email`, redirect alias | Transactional email history | Hide from navigation. Decide later whether client should see it. |
| `/custompages/:slug` | Legacy dynamic pages | `Custompages` | DB-driven pages | Keep hidden. Redirect missing/broken pages to home. |
| `/me` | Alias | `Redirect` | Profile shortcut | Keep redirect to `/client/profile`. |
| `/pricing`, `/cart` | Alias / old UX | Redirect/admin redirects | Old plan/cart entry points | Route public users to the home pricing block and clients to `/invoice#plans`. Avoid a second cart. |

## Page Audit By Template Type

### Home

Canonical page:

- `/`

Current state:

- Design is intentionally separate from the billing shell.
- Public pricing cards are the start of the funnel.
- Header auth panel is the preferred login/register UX.

Risks:

- Avoid moving client-area mobile fixes into the home page again.
- Check that plan buttons always lead to the current checkout route, not the old `/order/:slug` flow.

### Public Shell

Canonical pages:

- `/invoice` as the client payment hub
- `/orderbutton` as technical checkout fallback
- `/login`
- `/signup`
- `/password-reset`
- `/payment`
- `/about-us`
- `/contacts`
- `/offer`
- `/tos`
- `/privacy-policy`
- `/refund-policy`

Current state:

- Auth fallback pages exist separately from the header auth panel. That is acceptable as a fallback, but they must not feel like a second product.
- Legal/moderation pages mostly exist, but need one consistent shell pass after real company details are filled.
- Checkout remains available as a fallback, but client-facing plan choice is shown on `/invoice`.

Main mismatches to fix:

- `/invoice/:hash` was redesigned after this map was created; verify the live unpaid/paid states before changing adjacent payment pages.
- `/payment` and `/about-us` should use the same title/card rhythm as `/contacts`.
- `/signup` should be checked against the header signup panel so fields, legal text, and password UX match.

### Client Shell

Canonical pages:

- `/client`
- `/client/profile`
- `/client/balance`
- `/invoice`
- `/invoice/:hash`
- `/order/service`
- `/order/service/manage/:id`

Current state:

- Dashboard, payment history, balance, profile, connection list, and service detail are already in the Znet shell.
- User-facing copy should say plans/payment/history, not invoice/accounting terms.
- The client navigation is intentionally small: overview, connection, payment, profile.
- Support is routed through `/contacts`, not through old ticket/KB pages.
- Mobile spacing is back to shared shell behavior; future mobile work should happen as one pass, not per-page offsets.

Main mismatches to fix:

- Payment detail, gateway transition, and thank-you states now use the Znet shell; live-check unpaid, paid, and gateway return states.
- Service detail has useful information, but it can still drift into "technical manual" territory. Keep technical data collapsed.
- Balance is currently first-class but minimal: current amount, top-up form, collapsed history.

### Legacy / Hidden Surface

Routes that should not shape the main design:

- Old order flow: `/order`, `/order/:id`, `/order/:slug`.
- Support tickets and KB: `/support*`.
- News/blog/demo/custom/embed routes.
- Email history pages unless we intentionally expose them later.

Rule: these pages should be redirected, hidden from navigation, or left as technical fallbacks. They should not receive custom mobile or visual work until we decide they are part of the product.

## Recommended Work Order

1. Freeze mobile-only fixes unless a page is unusable.
2. Confirm canonical route decisions: `/invoice` as the client payment hub, `/contacts` as support, no old `/order` funnel.
3. Finish the desktop public shell pass: `/payment`, `/about-us`, legal pages, auth fallback pages.
4. Live-check `/invoice`, `/invoice/:hash`, gateway transition, and thank-you states as one payment flow.
5. Finish the client shell pass: dashboard, services, service detail, profile, balance.
6. Run one full mobile pass after the desktop flows stop moving.
7. Re-check Antilopay moderation checklist with real company details and test payment routes.

## Immediate Next Tasks

- Decide whether `/order`, `/order/:id`, and `/order/:slug` should redirect to the payment hub or only remain hidden technical routes.
- Live-check `/invoice`, `/invoice/:hash`, `/invoice/banklink/:hash/:id`, and `/invoice/thank-you/:hash`.
- Compare `/login`, `/signup`, and the header auth panel as one auth system.
- Keep `/contacts` as the only visible support route.
- After desktop is stable, make a single mobile checklist per template type: home, public shell, client shell.
