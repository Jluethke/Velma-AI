# Api Audit Trail Collector

Collect and parse API audit trails for the investigation time window.

## Inputs

- `preserved-evidence`: The preserved cloud evidence
- `incident-scope`: Time range and actors to focus on

## Outputs

- `api-events`: Parsed API call events with caller identity and parameters
- `api-anomalies`: Unusual API calls or patterns flagged for investigation

## Process

1. Parse CloudTrail, Azure Activity Log, or GCP Audit Log records
2. Filter to the investigation time window and affected resources
3. Identify the caller identity for each action (IAM user, role, service)
4. Flag unusual actions: first-time API calls, privilege changes, data access

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
