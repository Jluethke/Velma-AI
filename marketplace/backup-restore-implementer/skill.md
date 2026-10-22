# Backup Restore Implementer

Implement automated backups with tested restores to meet the recovery point objective.

## Inputs

- `architecture-assessment`: Database architecture assessment
- `reliability-requirements`: RTO and RPO targets

## Outputs

- `backup-configuration`: Automated backup schedules and retention
- `restore-test-results`: Results of restore testing

## Process

1. Configure automated backups (full, incremental, point-in-time)
2. Set retention policies meeting RPO requirements
3. Test restore to a separate environment and measure restore time
4. Automate periodic restore testing and reporting

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
