# Bootloader Security Test

Test the bootloader for insecure boot, firmware downgrade, and persistent backdoor installation.

## Inputs

- `device-under-test`: Physical device
- `access-level-per-interface`: Available debug access levels

## Outputs

- `bootloader-findings`: Bootloader security weaknesses found
- `persistent-access-paths`: Methods for achieving persistent unauthorized access

## Process

1. Determine if secure boot is enabled and verify the full chain of trust
2. Attempt to interrupt the boot process and access a bootloader shell
3. Test whether unsigned or modified firmware can be loaded
4. Check for firmware downgrade protections (anti-rollback fuses or counters)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
