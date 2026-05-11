# Core Patch Map

This file tracks places where the `my-storage-billing` fork diverges from upstream FOSSBilling outside of isolated extension modules.

Purpose:
- keep upgrades against `upstream/main` understandable
- separate safe extension work from built-in module patches
- make "can we do this without touching core?" a routine check

Current fork snapshot:
- local branch: `main`
- current HEAD when this file was added: `9632bc529`

## Patch Levels

### Level A: Extension / theme layer
Preferred place for custom work.

Examples in this repo:
- `src/modules/Appbridge/*`
- `src/modules/Orchestrator/*`
- `src/themes/huraga/*`

These are custom surfaces. Changes here are expected and low-risk for upstream rebases.

### Level B: Built-in module patches
Changes inside FOSSBilling modules that are not our own modules, but are still fairly contained.

Examples:
- built-in client/admin Twig templates
- built-in module services/controllers
- product/service config templates

These are acceptable, but every new change should be recorded here.

### Level C: Deep core patches
Changes that affect shared runtime behavior or version/bootstrap behavior.

Examples:
- `src/di.php`
- `src/library/FOSSBilling/*`
- shared API controller/runtime behavior

These need the strongest justification and should stay as small as possible.

## Current Map

### 1. Safe Custom Layer

These are our intended customization surfaces:

- `src/modules/Appbridge/*`
  - external mobile-app access bridge
  - token, device, bundle logic
- `src/modules/Orchestrator/*`
  - billing <-> orchestrator integration
  - provisioning/event status bridge
- `src/themes/huraga/*`
  - public site and client shell theme

Note:
- theme build artifacts under `src/themes/huraga/assets/build/*` are generated output
- source-of-truth for theme work is usually:
  - `src/themes/huraga/html/*`
  - `src/themes/huraga/assets/css/*`
  - `src/themes/huraga/assets/scss/*`
  - `src/themes/huraga/assets/js/*`

### 2. Built-in Module Patches

These files are not separate extensions; they are upstream modules we already changed.

#### Client / dashboard / pages
- `src/modules/Client/templates/client/mod_client_profile.html.twig`
  - profile simplification
  - Appbridge token/device UI
  - per-service device pools and order-scoped token creation
- `src/modules/Client/templates/client/mod_client_balance.html.twig`
  - wallet/balance page restyled for Znet
  - uses existing FOSSBilling add-funds invoice flow
- `src/modules/Index/templates/client/mod_index_dashboard.html.twig`
  - dashboard cleanup and product-card changes
- `src/modules/Page/templates/client/*`
  - public page copy/layout adjustments
  - contacts/support UX

#### Order / checkout flow
- `src/modules/Order/Controller/Client.php`
  - order route behavior diverges from upstream
- `src/modules/Order/Service.php`
  - order query/meta behavior adjusted
- `src/modules/Order/templates/client/*`
  - client order/service UI changes
  - service support/cancellation/upgrade actions route users to `/contacts`
- `src/modules/Orderbutton/templates/client/*`
  - checkout/order button flow adjustments

#### Support behavior
- `src/modules/Support/Controller/Client.php`
  - client support/ticket/knowledge-base routes redirect to `/contacts`

#### Invoice behavior
- `src/modules/Invoice/Api/Client.php`
  - added client-side invoice cancel endpoint
- `src/modules/Invoice/Service.php`
  - added client cancel behavior for unpaid invoices
- `src/modules/Invoice/templates/client/mod_invoice_index.html.twig`
  - invoice UI restyle and client actions

#### Product behavior
- `src/modules/Product/Service.php`
  - product pricing flag normalization
  - used by our current config-driven tariff metadata model
- `src/modules/Servicecustom/templates/admin/mod_servicecustom_config.html.twig`
  - adds explicit Appbridge device-limit field for custom tariffs
  - writes into `product.config[appbridge_device_limit]`

Important for upcoming device-limit work:
- device count is currently read by `Appbridge` from product/order `config`
- keys currently recognized:
  - `appbridge_device_limit`
  - `device_limit`
  - `devices_limit`
- there is not yet a dedicated admin UI field for this

Preferred next move:
- add a visible product/service config field
- store it in normal `product.config`
- avoid adding a new database column unless we really need one

Good candidate surfaces before touching deeper code:
- `src/modules/Product/templates/admin/mod_product_manage.html.twig`
- service-specific config templates such as:
  - `src/modules/Servicecustom/templates/admin/mod_servicecustom_config.html.twig`
  - `src/modules/Servicehosting/templates/admin/mod_servicehosting_config.html.twig`

#### API / admin UI behavior
- `src/modules/Api/Controller/Client.php`
  - API response version header behavior changed to use display version
- `src/modules/Email/templates/admin/mod_email_settings.html.twig`
  - admin UI adjustments
- `src/modules/Client/templates/email/mod_client_signup.html.twig`
  - signup email copy/layout adjustments

### 3. Deep Core Patches

These are the places we already changed that affect shared runtime behavior.

- `src/di.php`
  - Twig global version exposure changed to display version
- `src/library/FOSSBilling/Version.php`
  - fork version metadata diverges from upstream
  - added display version helper
- `src/modules/System/Service.php`
  - system version reporting now uses display version

These should stay documented very carefully because they can conflict with upstream upgrades.

## Generated / Build Output

These files may appear heavily changed in diff, but they are not the best place to reason about behavior:

- `src/themes/huraga/assets/build/*`
- `src/themes/admin_default/assets/build/*`

Treat them as generated artifacts.
When possible, review and edit the source files instead.

## What To Do Before Touching Built-in Code

Use this order:

1. Can this be done in:
   - `Appbridge`
   - `Orchestrator`
   - `huraga`
2. If not, can it be done in a built-in Twig template only?
3. If not, can it be done in a built-in module service/controller with a very small patch?
4. Only then consider deep core/runtime changes.

## Update Rule

When we touch a new non-extension area:

1. add it to this file in the same commit
2. note whether it is:
   - Level B built-in module patch
   - Level C deep core patch
3. write one short reason
4. if there is a better future home for it, note that too

## Fast Audit Commands

Useful local commands:

```powershell
git diff --name-only upstream/main...HEAD
```

```powershell
git diff --name-only upstream/main...HEAD | Where-Object { $_ -match '^src/' }
```

```powershell
git diff --name-only upstream/main...HEAD | Where-Object {
    $_ -match '^src/' -and
    $_ -notmatch '^src/modules/Appbridge/' -and
    $_ -notmatch '^src/modules/Orchestrator/' -and
    $_ -notmatch '^src/themes/huraga/'
}
```

## Practical Rule For Us

For the current project, we should treat the following as the normal customization boundary:

- first choice: `Appbridge`, `Orchestrator`, `huraga`
- second choice: built-in Twig/service config templates
- last choice: shared FOSSBilling runtime or base services

That keeps the fork understandable and gives us a real upgrade path instead of a mystery box.
