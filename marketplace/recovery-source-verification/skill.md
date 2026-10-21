# Recovery Source Verification

Verify that all restored systems were rebuilt from clean, trusted sources.

## Inputs

- `restored-systems`: List of systems restored during recovery
- `recovery-method`: Method used for each system (backup, reimage, rebuild)

## Outputs

- `source-verification`: Confirmation that each system was restored from a clean source
- `integrity-checklist`: Checklist of integrity checks performed per system

## Process

1. Verify backup integrity for each system restored from backup
2. Confirm reimaged systems used known-good baseline images
3. Check that rebuilt systems match the approved configuration
4. Document the verification status for each system

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
