# Znet Site Moderation Audit

Date: 2026-05-14
Live domain checked: `https://znetapp.ru`
Purpose: readiness check before Antilopay moderation.

## Summary

Current readiness before this remediation pass: approximately 70%.

The public structure is mostly in place: landing page, prices, payment page, contacts, offer, terms, privacy policy, refund policy, auth pages, sitemap, SSL, and redirects from legacy sections are working. The main moderation blockers are not layout polish; they are production business data, language consistency, checkout route consistency, and the missing Antilopay payment adapter/live payment path.

Working-tree fixes applied after the audit:

- Default locale detection now falls back to `ru_RU` instead of browser auto-detecting English for first-time visitors.
- Home/plan partial buttons no longer point to legacy `/order/{slug}` product pages.
- Legacy `/order/:id` and `/order/:slug` now redirect to `/invoice#plans`.
- Checkout/orderbutton copy has a Russian product-language pass and a real meta description.
- Root `src/favicon.ico` and `src/favicon.png` were added.
- `/payment` now includes a visible payment-methods block for MIR, Visa, Mastercard, and SBP.
- The leftover home FAQ anchor was removed.
- Theme asset cache-bust labels no longer contain `my-storage`.

## External Requirements Used

Antilopay documents require the site to have working internal links, a second-level domain, one domain for all store pages, service descriptions and prices in RUB, full merchant contact/legal information, payment/order/return rules, personal-data/payment confidentiality information, and a fully working site without technical work in progress.

## Live Route Check

Passed:

- `/`, `/payment`, `/about-us`, `/contacts`, `/offer`, `/tos`, `/privacy-policy`, `/refund-policy`, `/login`, `/signup`, `/password-reset`, `/orderbutton` return `200`.
- `/cart`, `/pricing`, `/order` redirect to `/#plans`.
- `/news`, `/blog` redirect to `/`.
- `/support`, `/support/contact-us`, `/contact-us`, `/embed/contact`, `/formbuilder/1` redirect to `/contacts`.
- `/embed/loginform` redirects to `/login`.
- `/embed/domainchecker`, `/custompages/test` redirect to `/`.
- `/preview/markdown` returns `404`.
- `/sitemap.xml` contains only the intended public pages.

Open:

- `/invoice`, `/order/service`, `/client/profile`, `/client/balance` redirect to `/login`, which is correct for guests, but the logged-in flow still needs a real test account walkthrough.
- `/invoice/:hash`, `/invoice/banklink/:hash/:id`, `/invoice/thank-you/:hash` need a real unpaid/paid invoice and payment gateway test.

## Blocking Findings

### 1. Production legal data is still placeholder

Live pages still show stale data on public moderation pages:

- `support@my-storage.org`
- `My Storage`
- `+7 000 000-00-00`
- placeholder INN/OGRNIP
- placeholder address text

Affected pages:

- `/contacts`
- `/about-us`
- `/payment`
- `/offer`
- `/privacy-policy`
- `/refund-policy`

Why it matters: payment moderation requires full merchant identity, address, phone, email, and requisites. This is the main blocker.

Fix:

- Fill real company data in FOSSBilling admin settings.
- Re-check the rendered public pages after cache clear/rebuild.

### 2. Antilopay payment adapter is not implemented yet

Search found only checklist/documentation references to Antilopay. There is no Antilopay payment adapter in the codebase yet.

Why it matters: site moderation can be prepared before gateway integration, but final payment acceptance cannot be tested without:

- payment adapter,
- callback URL,
- success/fail return URLs,
- test payment path.

Fix:

- Implement/install Antilopay as a FOSSBilling payment gateway.
- Run an unpaid invoice through banklink and thank-you routes.

### 3. Public default language can render English UI

Status: fixed in the working tree; verify after deploy/cache clear.

Fresh live requests can render shell labels such as `Payment`, `About`, `Support`, `Offer`, `Login`, `Create account`, `Checkout`, while the legal content is Russian.

Why it matters: moderation in Russia is safer with a consistent Russian public flow. Mixed language also makes the site look unfinished.

Fix:

- Set production default locale to `ru_RU`.
- Confirm first visit without cookies renders Russian navigation and auth labels.
- Keep RU/US switch as optional, not the default moderation view.

## High Priority Findings

### 4. Home pricing cards still link to old `/order/{slug}` routes

Status: fixed in the working tree; verify live redirects after deploy.

Current template source:

- `src/themes/huraga/html/znet_homepage.html.twig` uses `('/order/' ~ product.slug)|link`.

Live examples:

- `/order/storage-start?period=1M`
- `/order/storage-plus?period=1M`
- `/order/storage-family?period=1M`

Those pages return a Znet shell, but the title is still like `Order - Znet START`, and this creates a second checkout entry that competes with `/orderbutton`.

Fix:

- Decide one public checkout route.
- Prefer routing home plan buttons to `/orderbutton` with the product preselected, or make `/order/{slug}` a clean redirect to the unified checkout.

### 5. Checkout copy is still partly technical/English

Status: mostly fixed in the working tree for the main orderbutton/checkout path; do a final visual pass with a test account.

Visible examples on `/orderbutton` or `/order/{slug}`:

- `Checkout`
- `Pay`
- `Login or Register`
- `Plan selected`
- `Order - Znet START`

Why it matters: this is the highest-friction commerce page. It should be entirely product-language: "Оформление", "Оплатить", "Войти или создать аккаунт", "Тариф выбран".

Fix:

- Finish one checkout copy pass after deciding the canonical checkout route.

### 6. Payment-system logos are missing

Status: fixed in the working tree with text-based payment method badges. Replace with official brand assets later if Antilopay requires exact logos.

The payment page mentions cards, MIR, Visa, Mastercard, SBP, but does not display payment-system logos.

Why it matters: Antilopay rules mention payment-system logos as required site information for card acceptance.

Fix:

- Add a small payment methods block to `/payment` and the payment step: MIR, Visa, Mastercard, SBP, and Antilopay/secure payment wording if allowed by their brand rules.

## Medium Priority Findings

### 7. FAQ anchor remains on the home page

Status: fixed in the working tree.

Live and local template still contain:

- `<div id="faq" class="znet-anchor-target" aria-hidden="true"></div>`

The FAQ links were removed, but the anchor remains.

Fix:

- Remove the leftover anchor from `znet_homepage.html.twig`.

### 8. Root favicon URLs return 404

Status: fixed in the working tree by adding root favicon files under `src/`.

Checked:

- `/favicon.ico` returns `404`
- `/favicon.png` returns `404`

Page-level favicon links work, but browsers and crawlers still request the root favicon.

Fix:

- Add root favicon files or configure Caddy/Apache rewrite to the theme favicon.

### 9. `/orderbutton` has empty meta description

Status: fixed in the working tree.

Live `/orderbutton` title exists, but meta description is empty.

Fix:

- Add a short Russian meta description: "Выберите тариф Znet, создайте аккаунт и перейдите к безопасной оплате."

### 10. Asset version strings still contain `my-storage`

Status: fixed in the working tree for active Huraga layout asset tags.

Examples:

- `vendor.css?v=my-storage-20260418d`
- `huraga.js?v=my-storage-20260418d`

This is not visible to normal users, but it appears in page source.

Fix:

- Rename cache-bust strings later. This is cosmetic, not a moderation blocker.

## Client Area Audit Notes

Client shell is moving in the right direction:

- Dashboard is simple.
- Services are under `/order/service`.
- Payment hub is `/invoice`.
- Profile and balance are styled.
- Support routes point to `/contacts`.

Needs logged-in test account:

- signup,
- login,
- plan selection,
- checkout,
- invoice creation,
- gateway selection,
- thank-you,
- service page,
- Android/iPhone instruction states,
- balance top-up,
- profile update.

Likely simplification targets after moderation blockers:

- hide or soften invoice numbering where it still reads like accounting,
- confirm canceled invoices are hidden in user UI,
- keep technical service details collapsed,
- keep email history hidden unless intentionally exposed.

## Moderation Readiness Checklist

Before sending to Antilopay:

- [ ] Fill real company legal name.
- [ ] Fill INN and OGRN/OGRNIP.
- [ ] Fill legal/postal address.
- [ ] Fill public support email on the Znet domain if possible.
- [ ] Fill public phone.
- [x] Set default locale to Russian.
- [ ] Remove visible `my-storage.org` and placeholder values from live pages.
- [x] Remove the leftover FAQ anchor.
- [x] Add root favicon.
- [x] Add payment-system logos/payment methods block.
- [x] Decide and enforce one checkout route.
- [x] Polish checkout copy to Russian product language.
- [ ] Implement Antilopay gateway or at least define success/fail/callback URLs.
- [ ] Run one test account through checkout and invoice payment.

## Recommended Work Order

1. Fill production company data in admin and verify public legal pages.
2. Set default locale to `ru_RU`.
3. Fix the public home/checkout funnel: one route, one copy set.
4. Add payment logos and root favicon.
5. Implement Antilopay adapter and run test payment.
6. Logged-in walkthrough and final mobile smoke test.
