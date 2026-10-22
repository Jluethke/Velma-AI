# Archival Criteria Definer

Define which records qualify for archival based on age, status, and access frequency.

## Inputs

- `system-description`: The active system and its data model
- `retention-requirements`: Legal, regulatory, and business retention rules for each data type

## Outputs

- `archival-criteria`: Rules that determine when a record is eligible for archival (age, status, last access date)
- `exclusion-rules`: Records that must never be archived regardless of age (active cases, open transactions)

## Process

1. Review the retention requirements for each data type in the system.
2. Define the age threshold for archival (e.g., closed records older than 2 years).
3. Add status-based criteria (only closed, completed, or inactive records).
4. Define exclusion rules for records that must remain active regardless of age.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
