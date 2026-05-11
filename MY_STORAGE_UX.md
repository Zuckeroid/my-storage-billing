# Znet UX Notes

The FOSSBilling client area is intentionally minimal. Znet should feel like a friendly service, not like a billing control panel.

## Public Positioning

Znet is positioned as simple personal VPN access for regular customers:

- one account;
- clear subscription payment;
- quick connection from the client area;
- Android app for the full experience;
- iPhone connection through a compatible VPN client until a native app exists.

Public and client pages must not expose infrastructure details, internal provider names, or node-level language unless the user needs it for setup.

## Primary Flow

1. Customer opens the site.
2. Customer signs in or creates an account.
3. Customer chooses a VPN plan.
4. Customer pays the invoice.
5. Customer opens the service page and connects:
   - Android: download Znet APK, create device token, paste it into the app.
   - iPhone: copy subscription link into a compatible VPN client.

## Client Area

Keep only the essentials visible:

- overview;
- connection;
- payment;
- profile.

Support goes through `/contacts`. Technical order details stay collapsed unless the user opens them.
