# Znet Site Artifact Audit

Date: 2026-05-18
Live domain checked: `https://znetapp.ru`

Purpose: check the public site and known route surface after the shell layout fixes. This pass looks for visible legacy artifacts, broken redirects, old FOSSBilling pages, stale brand text, and moderation-facing problems.

## Scope

Checked live public routes:

- `/`
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
- `/orderbutton`
- legacy aliases: `/pricing`, `/cart`, `/order`, `/support`, `/contact-us`, `/news`, `/blog`
- technical redirects: `/embed/contact`, `/embed/loginform`, `/embed/domainchecker`, `/custompages/test`, `/formbuilder/1`
- assets and SEO: `/favicon.ico`, `/favicon.png`, `/sitemap.xml`, `/preview/markdown`

Client-area pages were checked statically by templates. A full visual walkthrough of `/`, `/invoice`, `/order/service`, `/order/service/manage/:id`, `/client/profile`, and `/client/balance` still requires an authenticated test session.

## Live Route Results

Core public pages returned `200` and had non-empty titles and meta descriptions:

| Route | Result |
| --- | --- |
| `/` | `200`, branded Znet home title |
| `/login` | `200`, login title |
| `/signup` | `200`, signup title |
| `/password-reset` | `200`, password reset title |
| `/payment` | `200`, payment title |
| `/about-us` | `200`, about title |
| `/contacts` | `200`, support title |
| `/offer` | `200`, public offer title |
| `/tos` | `200`, terms title |
| `/privacy-policy` | `200`, privacy title |
| `/refund-policy` | `200`, refund title |
| `/orderbutton` | `200`, plan checkout title |

Legacy routes resolve into canonical pages:

| Route | Final page |
| --- | --- |
| `/pricing` | `/#plans` |
| `/cart` | `/#plans` |
| `/order` | `/#plans` |
| `/news` | `/` |
| `/blog` | `/` |
| `/support` | `/contacts` |
| `/contact-us` | `/contacts` |
| `/embed/contact` | `/contacts` |
| `/embed/loginform` | `/login` |
| `/embed/domainchecker` | `/` |
| `/custompages/test` | `/` |
| `/formbuilder/1` | `/contacts` |

Other checks:

- `/favicon.ico` returns `200`.
- `/favicon.png` returns `200`.
- `/sitemap.xml` returns `200`.
- `/preview/markdown` returns `404`.

## Artifact Search

No live hits were found on the checked public pages for:

- broken shell artifact text `Ваш Zneton` / `Your Zneton`
- `FOSSBilling`
- `BoxBilling`
- `Powered by`
- `Knowledge Base`
- `Support Tickets`
- `Markdown preview`
- `Domain checker`
- `Lorem ipsum`

## Findings

### 1. Stale production company settings were visible

Live public pages contained old company identity values from FOSSBilling settings:

- `my-storage.org`
- `My Storage`

Affected checked pages:

- `/payment`
- `/about-us`
- `/contacts`
- `/offer`
- `/tos`
- `/privacy-policy`
- `/refund-policy`

Status: fixed in the working tree with safe Znet fallbacks for known stale values. Real requisites still need to be filled in billing admin at the final step.

Moderation impact: high until deployed. This is the main remaining public artifact before Antilopay moderation.

Fix: deploy the fallback patch, update company/legal settings in billing admin, then clear cache and re-check the pages.

### 2. `Ваш Zneton` was a shell-template artifact, not CSS or globe spacing

The artifact came from service Twig blocks being rendered before `<body>` in `layout_default.html.twig`:

- `shell_title` produced `Ваш Znet`;
- `shell_description_fallback` produced `on`.

Status: fixed in commit `d55e6b5e9`.

Deployment note: because `docker-compose.prod.yml` bakes application files into the Docker image, a normal `git pull` plus `restart app` is not enough. The app image must be rebuilt.

### 3. Old Huraga menu partials contained legacy items, but appeared unused

Static scan found old menu templates with hidden/setting-gated labels such as `Email`, `News`, and `Knowledge Base`:

- `src/themes/huraga/html/mobile_menu.html.twig`
- `src/themes/huraga/html/partial_menu.html.twig`

Search did not find active includes of these templates in the current Znet shell. They are not visible in the live checked routes.

Status: fixed in the working tree by removing `Email`, `News`, and `Knowledge Base` links from those partials.

Risk: low. They were dead/stale theme surface, not a live moderation blocker.

Recommendation: remove or quarantine these partials later, after one more check that no fallback layout includes them indirectly.

### 4. Source-level FOSSBilling references remain in technical files

Static grep still finds `FOSSBilling` in PHP comments, exceptions, framework globals, and admin/default theme files.

Risk: low for moderation as long as they are not visible on public pages.

Recommendation: do not rewrite framework internals just for source cleanliness. Keep focusing on rendered output.

## Recommended Next Checks

1. Rebuild the production app image after shell/template fixes:
   - `docker compose -f docker-compose.prod.yml build app`
   - `docker compose -f docker-compose.prod.yml up -d --no-deps --force-recreate app`
2. Re-check `/`, `/login`, `/payment`, `/contacts`, `/invoice`, and the logged-in dashboard.
3. Fill real company settings and legal requisites in billing admin.
4. Run an authenticated walkthrough with a test user:
   - dashboard
   - plan payment hub
   - service list
   - service detail
   - Android token
   - iPhone subscription link
   - profile
   - balance/top-up
5. Run a real unpaid invoice through the Antilopay gateway once the adapter is installed.
