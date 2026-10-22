# Api Health Metric Definer

Define the metrics that indicate API health.

## Inputs

- `api-architecture`: How the API is deployed and what it depends on
- `sla-requirements`: Service level agreements or targets

## Outputs

- `health-metrics`: Metrics to track: latency (p50, p95, p99), error rate, availability, throughput
- `metric-thresholds`: Normal, warning, and critical thresholds for each metric

## Process

1. Define the core metrics: request latency percentiles, error rate, availability, requests per second.
2. Add dependency metrics: database latency, cache hit rate, external API latency.
3. Set thresholds based on SLA requirements: what is normal, what triggers a warning, what triggers an alert.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
