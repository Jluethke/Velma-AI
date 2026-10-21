# Offsite Backup Integrity Checker

Verify the integrity and accessibility of offsite or air-gapped backup copies.

## Inputs

- `backup-inventory`: Backup inventory including offsite locations
- `ransomware-resilience-results`: Resilience findings for correlation

## Outputs

- `offsite-integrity-results`: Verification results for offsite backup copies
- `backup-security-report`: Complete backup and recovery security report

## Process

1. Verify that offsite copies exist and are current
2. Test restoration from the offsite copy independently of primary backups
3. Confirm network isolation: offsite copies cannot be reached from production networks
4. Compile all findings into the backup and recovery security report with risk ratings

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
