# Backup Integrity Tester

Test backup integrity, isolation, and recovery time for critical systems.

## Inputs

- `backup-inventory`: Inventory of backup systems and schedules
- `critical-systems-list`: List of systems critical to business operations
- `rto-rpo-targets`: Recovery time and recovery point objectives

## Outputs

- `backup-test-results`: Restore success/failure for each system with actual recovery time
- `backup-isolation-status`: Whether backups are isolated from the production network

## Process

1. Verify that backups exist and are current for all critical systems
2. Test restore of each backup type (full, incremental, snapshot) to an isolated environment
3. Measure actual recovery time and compare against RTO targets
4. Verify that backup infrastructure is isolated and not reachable from the production domain

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
