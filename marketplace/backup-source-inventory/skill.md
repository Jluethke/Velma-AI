# Backup Source Inventory

Inventory all data sources that need to be backed up.

## Inputs

- `system-inventory`: List of systems, servers, and devices that hold data
- `data-criticality`: How critical each data source is (mission-critical, important, nice-to-have)

## Outputs

- `backup-scope`: List of data sources to back up with size, change rate, and criticality
- `exclusion-list`: Data explicitly excluded from backup with rationale

## Process

1. List every data source: databases, file servers, cloud storage, SaaS applications, local machines.
2. For each source, record the data size, daily change rate, and criticality level.
3. Identify data that does not need backup: temporary files, build artifacts, publicly available data.
4. Produce the backup scope and exclusion list.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
