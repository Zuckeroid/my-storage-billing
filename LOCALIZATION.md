# Localization Policy

This fork intentionally exposes only two UI languages:

- `en_US` - English
- `ru_RU` - Russian

FOSSBilling can technically install many locale packages, but this product keeps
the public and admin interface limited to English and Russian to avoid confusing
customers and staff.

## Runtime

Allowed languages are configured in `src/config-sample.php`:

```php
'i18n' => [
    'locale' => 'en_US',
    'enabled_locales' => ['en_US', 'ru_RU'],
],
```

The whitelist is enforced by `FOSSBilling\i18n`, so extra locale folders will not
appear in language selectors unless they are added to `enabled_locales`.

## Russian Translation

The initial `ru_RU` package is based on the official FOSSBilling locale
repository. Product-specific wording should be corrected in:

```text
src/locale/ru_RU/LC_MESSAGES/messages.po
```

After editing `messages.po`, rebuild `messages.mo` before deployment.
