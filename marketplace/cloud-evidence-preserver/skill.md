# Cloud Evidence Preserver

Preserve cloud logs and snapshots before auto-deletion or rotation.

## Inputs

- `cloud-account`: The cloud account and region to preserve evidence from
- `incident-scope`: Time range and resources involved in the incident

## Outputs

- `preserved-evidence`: Snapshots, log exports, and configuration backups
- `preservation-log`: Record of what was preserved and when

## Process

1. Snapshot affected VM instances and storage volumes
2. Export CloudTrail, Activity Log, or Audit Log to a locked bucket
3. Capture current IAM policies and resource configurations
4. Set legal hold on relevant storage objects

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
