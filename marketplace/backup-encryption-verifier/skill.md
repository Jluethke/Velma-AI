# Backup Encryption Verifier

Verify that backups are encrypted at rest and in transit.

## Inputs

- `backup-inventory`: Inventory of backup systems
- `backup-policies`: Encryption requirements from policy

## Outputs

- `encryption-verification-results`: Results of encryption verification for each backup system
- `key-management-findings`: Findings on backup encryption key management practices

## Process

1. Verify encryption in transit for each backup data flow
2. Verify encryption at rest for each backup storage location
3. Check key management: where keys are stored, who has access, rotation schedule
4. Test that backups cannot be read without the correct decryption key

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
