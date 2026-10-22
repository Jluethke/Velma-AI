# Cmdb Change Tracker

Track changes to configuration items over time.

## Inputs

- `discovery-configuration`: Discovery settings
- `reconciliation-rules`: Matching rules

## Outputs

- `change-tracking-policy`: How unauthorized changes are detected and flagged
- `baseline-snapshots`: Baseline snapshots for each CI type

## Process

1. Capture the baseline state of all CIs.
2. Schedule regular discovery scans to detect drift.
3. Flag unauthorized changes for investigation.
4. Integrate with the change management process so approved changes update the CMDB.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
