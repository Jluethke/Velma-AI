# Quiet Hours Override Setup

Configure quiet hours and the override rules that bypass them for critical alerts.

## Inputs

- `escalation-rules`: Escalation rules for each severity
- `channel-map`: Alert category to channel mapping

## Outputs

- `quiet-hours-config`: Quiet hours schedule and override rules
- `override-criteria`: Criteria that cause an alert to bypass quiet hours

## Process

1. Define quiet hours for each team or timezone (e.g., 10 PM to 7 AM local).
2. Specify which severity levels are suppressed during quiet hours (informational, warning).
3. Define the override criteria: critical alerts always ring through, customer-facing outages always ring through.
4. Document the configuration so on-call staff know what will and will not wake them.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
