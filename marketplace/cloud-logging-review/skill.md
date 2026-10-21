# Cloud Logging Review

Review logging and monitoring configurations for completeness, covering API activity, network flow logs, and alerting rules.

## Inputs

- `resource-inventory`: Inventory of all resources
- `storage-findings`: Storage security context

## Outputs

- `logging-gaps`: Services and regions missing logging coverage
- `monitoring-assessment`: Assessment of alerting rules and incident detection capability

## Process

1. Verify that API activity logging (CloudTrail, Activity Log, Audit Log) is enabled in all regions.
2. Check that network flow logs capture traffic for critical VPCs.
3. Review alerting rules for coverage of critical security events.
4. Verify that logs are stored in tamper-resistant, centralized locations.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
