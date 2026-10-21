# Endpoint Exfiltration Tester

Test endpoint-based exfiltration channels including USB, print, and clipboard.

## Inputs

- `test-data-set`: Synthetic test data
- `classification-matrix`: Expected controls per data type

## Outputs

- `endpoint-test-results`: Pass/fail for each endpoint exfiltration channel
- `endpoint-detection-times`: Time from attempt to alert for each test

## Process

1. Test USB device write with classified data (mass storage, phone, camera)
2. Test print to physical and virtual printers with classified content
3. Test clipboard copy between controlled and uncontrolled applications
4. Test screen capture and screen sharing with classified data on screen

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
