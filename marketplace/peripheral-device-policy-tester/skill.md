# Peripheral Device Policy Tester

Test USB and peripheral device control policies.

## Inputs

- `endpoint-inventory`: Endpoint inventory
- `hardening-baselines`: Peripheral control requirements

## Outputs

- `peripheral-control-results`: Results of peripheral device policy tests
- `data-exfiltration-risks`: Data exfiltration risks via physical media

## Process

1. Test USB mass storage device acceptance on sample endpoints
2. Test other peripheral types: USB network adapters, USB-to-serial, Bluetooth adapters
3. Check whether device control policies are enforced by endpoint management or can be bypassed locally
4. Assess data exfiltration risk if USB storage is permitted

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
