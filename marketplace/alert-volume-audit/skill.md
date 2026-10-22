# Alert Volume Audit

Audit the current alert volume, frequency, and actionability.

## Inputs

- `alert-history`: Historical alert data (last 30 to 90 days)
- `response-logs`: Logs of how each alert was handled (acknowledged, escalated, ignored, auto-resolved)

## Outputs

- `alert-inventory`: Inventory of all alert rules with volume and response metrics
- `noise-candidates`: Alerts flagged as likely noise (high volume, low action rate)

## Process

1. Pull the alert history for the last 30 to 90 days grouped by alert rule.
2. For each rule, calculate the volume, false positive rate, and action rate (percentage that led to a human response).
3. Flag alerts with an action rate below 10% as noise candidates.
4. Rank all alerts by noise score (high volume multiplied by low action rate).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
