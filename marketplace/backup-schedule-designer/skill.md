# Backup Schedule Designer

Define the backup schedule, retention policy, and recovery objectives.

## Inputs

- `backup-scope`: Data sources to back up with criticality
- `exclusion-list`: Excluded data sources

## Outputs

- `backup-schedule`: Frequency for each data source (continuous, daily, weekly, monthly)
- `retention-policy`: How long each backup is kept and the recovery point and time objectives (RPO, RTO)

## Process

1. Set the recovery point objective (RPO) for each criticality level: how much data loss is acceptable.
2. Set the recovery time objective (RTO): how quickly each source must be restored.
3. Design the schedule to meet the RPO: continuous replication, daily incremental, weekly full.
4. Define the retention: how many daily, weekly, and monthly backups to keep.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
