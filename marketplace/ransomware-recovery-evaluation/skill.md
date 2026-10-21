# Ransomware Recovery Evaluation

Evaluate all recovery options and select the best path forward.

## Inputs

- `full-scope-report`: Complete scope of the ransomware impact
- `ransomware-variant-id`: Identified ransomware family

## Outputs

- `recovery-plan`: Selected recovery approach with steps and timeline
- `backup-status`: Assessment of backup availability and integrity

## Process

1. Check backup availability and verify integrity for all affected systems
2. Search for public decryptors matching the identified ransomware variant
3. Assess whether shadow copies or other recovery points survived
4. Select the recovery path (restore from backup, use decryptor, or rebuild) and document the decision

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
