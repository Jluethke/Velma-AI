# Wifi Psk Strength Setter

Set strong pre-shared keys where PSK authentication is required (guest or IoT networks).

## Inputs

- `ap-inventory`: Access points with PSK networks
- `wps-status`: WPS confirmed disabled

## Outputs

- `psk-config`: Updated PSK settings per SSID
- `psk-rotation-schedule`: Schedule for PSK rotation

## Process

1. Generate a strong random passphrase (minimum 20 characters) for each PSK SSID
2. Apply the new PSK to all access points broadcasting that SSID
3. Document the PSK rotation schedule (quarterly or on personnel change)
4. Test connectivity with the new PSK

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
