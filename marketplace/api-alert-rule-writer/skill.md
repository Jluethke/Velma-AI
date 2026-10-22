# Api Alert Rule Writer

Configure alerting rules and escalation paths.

## Inputs

- `metric-thresholds`: When to alert
- `monitoring-dashboard`: Where to look when alerted

## Outputs

- `alert-rules`: Alerting rules with conditions, severity, and notification channels
- `api-monitoring-doc`: Complete API monitoring and alerting documentation

## Process

1. Write alert rules for each threshold: warning (notify channel), critical (page on-call).
2. Add compound alerts: error rate AND latency spike indicates a different problem than either alone.
3. Document the runbook: when this alert fires, check these things in this order.
4. Compile the monitoring documentation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
