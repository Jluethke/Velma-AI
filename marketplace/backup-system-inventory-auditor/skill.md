# Backup System Inventory Auditor

Inventory all backup systems, schedules, and retention policies.

## Inputs

- `infrastructure-inventory`: Inventory of systems that need backup coverage
- `backup-policies`: Documented backup policies and schedules

## Outputs

- `backup-inventory`: Complete inventory of backup systems with schedules and retention
- `unprotected-systems`: Systems or data sets not covered by any backup schedule

## Process

1. Catalog every backup system in operation (agent-based, snapshot, replication, tape)
2. Map each production system to its backup coverage and verify schedule adherence
3. Identify systems or datasets with no backup coverage
4. Verify that retention periods meet regulatory and business requirements

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
