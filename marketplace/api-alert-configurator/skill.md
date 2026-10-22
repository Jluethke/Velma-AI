# Api Alert Configurator

Configure alerts for SLO violations and anomalies.

## Inputs

- `sli-slo-mapping`: The SLIs and SLOs to alert on
- `dashboard-config`: The monitoring dashboard for context

## Outputs

- `alert-rules`: Alert rules: thresholds, evaluation windows, severity levels, notification channels
- `runbook-stubs`: Runbook stubs for each alert (what it means, likely causes, first steps)

## Process

1. Configure SLO-based alerts: alert when the error budget burn rate is too fast (multiwindow, multi-burn-rate).
2. Configure threshold alerts for immediate issues: error rate above 5%, p99 latency above 5 seconds.
3. Set severity levels: warning (investigate), critical (page on-call), emergency (all hands).
4. Write a runbook stub for each alert: what it means, common causes, first diagnostic steps.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
