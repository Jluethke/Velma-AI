# Backup Plan Documenter

Compile the backup setup document covering scope, schedule, destinations, automation, and restore procedures.

## Inputs

- `automation-config`: Configured backup jobs
- `restore-test-result`: Restore test results

## Outputs

- `backup-setup-document`: Complete backup plan with scope, schedule, destinations, automation, and restore procedures
- `runbook`: Step-by-step restore runbook for each data source

## Process

1. Compile the backup plan: scope, schedule, retention, destinations, encryption, and costs.
2. Write the restore runbook: step-by-step instructions for restoring each data source from each destination.
3. Include the test restore results as validation that the process works.
4. Set the review cadence: quarterly backup audit and annual restore drill.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
