# Cloud Audit Log Enabler

Enable audit logging for all API calls and management plane activity.

## Inputs

- `cloud-provider`: Cloud provider
- `account-id`: Cloud account identifier

## Outputs

- `audit-log-config`: Applied audit logging configuration
- `log-storage`: Log destination bucket or workspace with retention settings

## Process

1. Enable CloudTrail (AWS), Activity Log (Azure), or Audit Log (GCP)
2. Configure log storage in a dedicated bucket with versioning and encryption
3. Set log retention to meet compliance requirements
4. Verify that a test API call generates an audit log entry

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
