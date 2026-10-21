# Endpoint Disk Encryptor

Enable full disk encryption on the endpoint.

## Inputs

- `os-type`: Operating system (Windows, macOS, Linux)
- `encryption-policy`: Organization encryption requirements and key escrow settings

## Outputs

- `encryption-status`: Disk encryption status and recovery key location
- `encryption-config`: Applied encryption settings (BitLocker, FileVault, LUKS)

## Process

1. Check if full disk encryption is already enabled
2. Enable BitLocker (Windows), FileVault (macOS), or LUKS (Linux)
3. Escrow the recovery key to the designated management system
4. Verify the disk is fully encrypted

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
