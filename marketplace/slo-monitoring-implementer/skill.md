# Slo Monitoring Implementer

Implement SLO monitoring dashboards and burn-rate alerts to track compliance in real time.

## Inputs

- `sli-data-sources`: Data sources for each SLI
- `error-budgets`: Error budgets for each SLO

## Outputs

- `slo-dashboards`: Dashboards showing SLO compliance and budget burn
- `burn-rate-alerts`: Alerts that fire when error budget burns too fast

## Process

1. Build dashboards showing current SLI values and SLO compliance
2. Add error budget remaining and burn rate visualization
3. Configure multi-window, multi-burn-rate alerts
4. Test alerts by simulating SLO violations

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
