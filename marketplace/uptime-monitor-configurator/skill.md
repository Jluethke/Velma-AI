# Uptime Monitor Configurator

Set up uptime monitoring with HTTP checks and ping tests.

## Inputs

- `site-endpoints`: URLs and endpoints to monitor
- `monitoring-requirements`: SLA targets and check frequency

## Outputs

- `uptime-config`: Configured uptime checks with intervals and thresholds
- `alert-contacts`: Who gets notified and through what channel

## Process

1. Configure HTTP checks for each endpoint (homepage, API, login, key pages).
2. Set the check interval based on the SLA target.
3. Define the failure threshold (consecutive failures before alerting).
4. Configure notification channels (email, SMS, Slack, PagerDuty).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
