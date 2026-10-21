# Wifi Wpa3 Configurator

Configure WPA3 or WPA2-Enterprise with RADIUS authentication on access points.

## Inputs

- `ap-inventory`: List of access points with model and firmware version
- `auth-method`: Authentication method (WPA3-Enterprise, WPA2-Enterprise with RADIUS, or WPA3-Personal)

## Outputs

- `wireless-auth-config`: Applied wireless authentication settings per SSID
- `radius-config`: RADIUS server configuration if using Enterprise mode

## Process

1. Upgrade access point firmware to support WPA3 if needed
2. Configure WPA3 or WPA2-Enterprise with RADIUS for the corporate SSID
3. Configure the RADIUS server with certificate-based EAP (EAP-TLS or PEAP)
4. Test authentication from a client device

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
