# Wireless Access Point Discovery

Discover all wireless access points, their SSIDs, channels, encryption types, and signal strengths within the authorized test area.

## Inputs

- `test-location`: Physical location and boundaries for wireless testing
- `authorized-ssids`: List of organization-owned SSIDs

## Outputs

- `access-point-inventory`: All detected access points with SSID, BSSID, channel, and encryption
- `signal-coverage-map`: Signal strength and coverage area for each access point

## Process

1. Scan all wireless channels (2.4 GHz and 5 GHz) for beacon frames.
2. Record SSID, BSSID, channel, encryption type, and signal strength for each AP.
3. Identify organization-owned vs unknown access points.
4. Map signal coverage boundaries to identify leakage outside the premises.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
