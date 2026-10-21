# Ics Firmware Update Review

Review firmware update procedures for integrity and authentication.

## Inputs

- `ics-device-inventory`: Devices and their current firmware versions
- `credential-findings`: Access levels for firmware management interfaces

## Outputs

- `firmware-findings`: Firmware update security weaknesses
- `patch-status-report`: Current patch levels compared to vendor advisories

## Process

1. Check firmware versions against vendor security advisories
2. Review firmware update procedures for signature verification
3. Test if firmware can be downgraded to a vulnerable version
4. Document the patch management process and its limitations for safety-critical systems

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
