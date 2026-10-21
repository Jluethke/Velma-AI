# Obd Port Security Test

Test OBD-II port security including protocol support, data exposure, and unauthorized command acceptance.

## Inputs

- `vehicle-interface`: OBD-II port connection details
- `can-message-catalog`: Known message catalog for context

## Outputs

- `obd-findings`: OBD-II port security findings
- `data-exposure-inventory`: Sensitive data accessible through the OBD port

## Process

1. Test all supported OBD protocols (CAN, K-Line, J1850)
2. Enumerate all supported PIDs and their data exposure
3. Test for mode 08 and mode 09 data access restrictions
4. Check whether aftermarket device communication is isolated from safety-critical buses

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
