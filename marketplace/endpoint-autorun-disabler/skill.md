# Endpoint Autorun Disabler

Disable autorun for removable media and restrict USB device usage if required.

## Inputs

- `os-type`: Operating system
- `encryption-status`: Disk encryption status

## Outputs

- `autorun-config`: Applied autorun and removable media settings
- `usb-policy`: Applied USB device control policy

## Process

1. Disable autorun and autoplay for all drive types
2. Configure USB device class restrictions if required by policy
3. Test that inserting removable media does not auto-execute content

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
