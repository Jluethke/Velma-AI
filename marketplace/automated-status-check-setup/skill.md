# Automated Status Check Setup

Configure automated checks that update the status page based on service health.

## Inputs

- `component-list`: Components displayed on the status page
- `dependency-map`: Backend dependency map

## Outputs

- `check-configuration`: Automated health checks configured for each component
- `threshold-rules`: Rules for when a check failure triggers a status change

## Process

1. For each component, define the health check (HTTP endpoint, synthetic transaction, metric threshold).
2. Set the check interval (every 1 minute for critical, every 5 minutes for others).
3. Define the threshold for each status level (e.g., 3 consecutive failures = degraded, 10 = outage).
4. Configure the integration between the monitoring system and the status page platform.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
