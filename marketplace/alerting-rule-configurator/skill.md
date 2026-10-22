# Alerting Rule Configurator

Configure alerting rules for key metrics with severity levels and notification routing.

## Inputs

- `service-dashboards`: Dashboards with the metrics to alert on
- `reliability-goals`: SLOs and response time targets

## Outputs

- `alerting-rules`: Configured alert rules with thresholds and severity
- `alert-routing-config`: Routing configuration for alert delivery

## Process

1. Define alert rules for SLO burn rate (multi-window, multi-burn-rate)
2. Define infrastructure alerts (disk full, memory pressure, certificate expiry)
3. Set severity levels and routing for each alert
4. Test each alert rule with synthetic data

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
