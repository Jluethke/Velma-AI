# Secure Boot Firmware Checker

Verify secure boot configuration and firmware integrity on endpoints.

## Inputs

- `endpoint-inventory`: Endpoint inventory
- `encryption-status`: Disk encryption status for correlation

## Outputs

- `firmware-integrity-results`: Secure boot and firmware integrity verification results
- `endpoint-security-report`: Complete endpoint security assessment report

## Process

1. Verify secure boot is enabled and enforcing on each endpoint
2. Check UEFI firmware version against known vulnerabilities
3. Verify that firmware update mechanisms are authenticated
4. Compile all endpoint findings into the final report with severity ratings and remediation priorities

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
