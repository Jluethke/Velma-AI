# Ransomware Recovery Execution

Execute the recovery plan to restore affected systems and data.

## Inputs

- `recovery-plan`: Selected recovery approach
- `backup-status`: Verified backup locations and integrity

## Outputs

- `recovery-log`: Record of all restoration actions and their outcomes
- `restored-systems-list`: List of systems restored and their verification status

## Process

1. Rebuild or reimage affected systems from clean media
2. Restore data from verified backups, applying the most recent clean backup
3. Patch and harden systems before reconnecting to the network
4. Verify each restored system is functional and free of malware

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
