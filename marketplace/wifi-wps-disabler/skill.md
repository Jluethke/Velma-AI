# Wifi Wps Disabler

Disable Wi-Fi Protected Setup (WPS) on all access points.

## Inputs

- `ap-inventory`: Access points to configure
- `wireless-auth-config`: Wireless authentication already configured

## Outputs

- `wps-status`: WPS disabled status per access point
- `wps-change-log`: Record of WPS configuration changes

## Process

1. Check WPS status on each access point
2. Disable WPS PIN method and push-button method
3. Verify WPS is no longer advertised in beacon frames

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
