# Rogue Access Point Detection

Detect rogue access points, evil twins, and unauthorized wireless devices within the organization's premises.

## Inputs

- `access-point-inventory`: All detected access points
- `authorized-ssids`: Known legitimate SSIDs and BSSIDs

## Outputs

- `rogue-ap-findings`: Unauthorized access points and evil twins detected
- `rogue-ap-locations`: Approximate physical locations of rogue devices

## Process

1. Compare detected BSSIDs against the authorized access point inventory.
2. Identify access points broadcasting organization SSIDs from unauthorized hardware.
3. Triangulate approximate physical locations of rogue devices using signal strength.
4. Check for unauthorized Wi-Fi bridges or repeaters connected to the wired network.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
