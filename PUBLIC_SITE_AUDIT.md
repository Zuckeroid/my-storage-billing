# Public Site Audit

Date: 2026-05-11
Domain checked: `https://znetapp.ru`

This audit covers the public billing website before payment-provider moderation. It is not a legal review; legal entity details still need to be filled with the real production data.

## Public Pages

Core public pages currently return `200`:

- `/` - landing page with plans
- `/payment` - payment information
- `/about-us` - service description
- `/contacts` - support and legal contact page
- `/offer` - public offer
- `/tos` - user agreement
- `/privacy-policy` - privacy policy
- `/refund-policy` - refund policy
- `/login` - client login
- `/signup` - registration
- `/password-reset` - password reset
- `/sitemap.xml` - generated sitemap

Commerce and client-flow routes:

- `/orderbutton` and `/orderbutton/js` return `200`; they are part of checkout/order UI.
- `/order/:id` and `/order/:slug` are public product checkout routes.
- `/invoice/:hash`, `/invoice/pdf/:hash`, `/invoice/print/:hash`, `/invoice/thank-you/:hash`, `/invoice/banklink/:hash/:id`, `/banklink/:hash/:id` are public-by-hash billing/payment routes.
- `/order/service`, `/service`, `/invoice`, `/support`, `/emails` redirect to `/login`; this is expected for client-only areas.

Public API surface:

- `/api/guest/*` is intentionally public for billing frontend actions.
- Confirmed live guest endpoints include `/api/guest/system/company`, `/api/guest/product/get_list`, `/api/guest/appbridge/settings`.

## Hidden/Unexpected Pages

Status after local hardening changes:

- `/preview/markdown`: template removed, should become a normal `404`.
- `/news`, `/news/*`, `/blog`, `/blog/*`: redirected to `/`.
- `/support/contact-us`, `/contact-us`, and their conversation URLs: redirected to `/contacts`.
- `/embed/contact`: redirected to `/contacts`.
- `/embed/loginform`: redirected to `/login`.
- `/embed/domainchecker` and other embed widgets: redirected to `/`.
- `/custompages/*`: missing/broken custom pages redirect to `/`.
- `/formbuilder/*`: redirected to `/contacts`.
- `/me`: redirected to `/client/profile`.
- `/balance`: redirected to `/client/balance`.
- `/order`: redirected to `/#plans`.
- `/pricing`: redirected to `/#plans`.
- `/cart`: redirected to `/#plans`.
- `/sitemap.xml`: static-only; it no longer includes News, products, or knowledge-base entries.
- Public error pages no longer print raw exception messages and use `noindex,nofollow`.
- Remaining client-facing cloud-storage wording in order/signup/access emails was changed to VPN wording.

Initial live findings before these changes:

- `/preview/markdown` returns `200` and exposes a technical `Markdown preview` template from `mod_page_preview_markdown.html.twig`.
- `/news` and `/blog` return `200` and show default FOSSBilling demo articles.
- `/support/contact-us` and `/contact-us` return `200` and show the stock FOSSBilling support form.
- `/embed/contact`, `/embed/loginform`, `/embed/domainchecker` return `200` and expose old embedded widgets; `domainchecker` is unrelated to VPN.
- `/custompages/test`, `/formbuilder/1`, `/me`, `/balance` return FOSSBilling error pages with HTTP `200`, including internal method/module names.
- `/order` redirects to `/pricing`, but `/pricing` returns `404`.

## Moderation Risks

High priority:

- Production company data is still stale on the live site: `support@my-storage.org`, `My Storage`, `+7 000 000-00-00`, placeholder INN/OGRNIP, and placeholder address appear on legal/contact/payment pages.
- Re-check live deployment to confirm demo news, technical preview, stock embeds, and broken legacy redirects are no longer visible.

Medium priority:

- Public pages mix languages: legal content is mostly Russian, while navigation/auth labels often default to English because the live session sets `fb_locale=en_US`.
- Metadata and company values should be checked again after production settings are filled.

Low priority:

- Asset version strings and CSS class names still contain `my-storage`/`storage`; these are not visible to normal users, but can be cleaned later.
- `/support/kb` returns `404`; acceptable if knowledge base is not used.

## Recommended Fix Order

1. Fill real company settings on production: legal name, support email, phone, INN/OGRNIP, address, website, signature, and meta author.
2. Deploy the hardening changes and re-check the live routes.
3. Set the default public language consistently, likely `ru_RU` for moderation in Russia.
4. Later, replace broad redirects with dedicated branded `404` pages if we want cleaner SEO behavior.
