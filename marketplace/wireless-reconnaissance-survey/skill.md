# Wireless Reconnaissance Survey

Survey the wireless environment to discover access points, clients, and RF characteristics.

## Inputs

- `wireless-scope`: Authorized wireless networks and physical locations
- `authorization-record`: Written authorization for wireless testing

## Outputs

- `wireless-survey-results`: Discovered SSIDs, BSSIDs, channels, encryption types, and client counts
- `rf-environment-map`: Channel utilization, signal strength, and interference map

## Process

1. Perform a passive wireless survey to identify all access points and their configurations
2. Map channel utilization and signal coverage areas
3. Identify client devices and their probe requests for known networks
4. Catalog encryption types (Open, WEP, WPA2-PSK, WPA2-Enterprise, WPA3) across all SSIDs

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
