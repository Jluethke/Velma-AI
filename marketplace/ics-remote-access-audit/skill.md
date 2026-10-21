# Ics Remote Access Audit

Check for unauthorized or insecure remote access paths into the ICS environment.

## Inputs

- `ics-device-inventory`: Devices that may have remote access enabled
- `segmentation-findings`: Known paths between IT and OT

## Outputs

- `remote-access-findings`: Unauthorized or insecure remote access paths found
- `vendor-access-audit`: Status of vendor remote access accounts and their controls

## Process

1. Scan for remote access services (RDP, VNC, SSH, TeamViewer) on OT network devices
2. Review vendor remote access accounts and their activity logging
3. Test for cellular modems or wireless access points providing bypass paths
4. Verify that remote access sessions require MFA and are logged

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
