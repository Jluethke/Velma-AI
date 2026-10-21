# Disk Encryption Verifier

Verify full disk encryption deployment and key management across endpoints.

## Inputs

- `endpoint-inventory`: Endpoint inventory
- `hardening-baselines`: Encryption requirements from baseline

## Outputs

- `encryption-status`: Disk encryption status for each endpoint
- `key-escrow-status`: Recovery key escrow verification results

## Process

1. Check each endpoint for full disk encryption (BitLocker, FileVault, LUKS)
2. Verify that encryption is active (not suspended or partially encrypted)
3. Confirm recovery keys are escrowed to the management system
4. Test whether cold boot or DMA attacks could bypass encryption on sample devices

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
