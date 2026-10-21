# Iot Ota Update Integrity

Test the over-the-air update mechanism for integrity, authentication, and rollback protection.

## Inputs

- `firmware-contents`: Extracted firmware for update mechanism analysis
- `network-findings`: Network protocol findings for update channel identification

## Outputs

- `update-findings`: Weaknesses in the firmware update mechanism
- `tamper-test-results`: Results of attempting to install a modified firmware update

## Process

1. Identify the update server and protocol
2. Check whether firmware updates are signed and the signature is verified before installation
3. Attempt to serve a modified firmware update to the device
4. Test for rollback protection (can an older, vulnerable firmware be reinstalled)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
