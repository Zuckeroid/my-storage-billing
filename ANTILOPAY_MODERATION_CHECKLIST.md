# Antilopay Moderation Checklist

## Site Pages

- Main page explains that Znet provides VPN access, not file storage.
- Tariffs are visible on the site and prices are shown in RUB.
- Payment page explains payment steps, payment security, available methods, and what to do if payment fails.
- Service delivery is described as digital delivery through the client area and email.
- Refund policy is available from the footer.
- Public offer is available from the footer.
- Privacy policy is available from the footer.
- Contacts page contains support email, phone, legal name, INN, registration number, and address.
- All public pages are on the same second-level domain `znetapp.ru`.
- SSL is enabled and there are no broken public links.

## Billing Admin Data To Fill

Open FOSSBilling admin settings and make sure company data is complete:

- Company legal name.
- INN.
- OGRN or OGRNIP.
- Legal or postal address, not "до востребования".
- Support email on the site domain if possible.
- Public phone number.

These fields are rendered on `/about-us`, `/contacts`, `/offer`, and `/privacy-policy`.

## Antilopay Project

- Project URL: `https://znetapp.ru`.
- Business category: VPN / information technology service / remote digital service.
- Success URL: client invoice or profile page.
- Fail URL: payment or invoice page.
- Callback URL: payment adapter endpoint after Antilopay integration is implemented.

## Before Sending To Moderation

- Open `/`, `/payment`, `/about-us`, `/contacts`, `/offer`, `/tos`, `/privacy-policy`, `/refund-policy`.
- Create a test account.
- Add a tariff to cart.
- Confirm the invoice shows the correct price in RUB.
- Check that support email and phone are visible without logging in.
- Check that old `my-storage.org` links are not visible on public pages.
