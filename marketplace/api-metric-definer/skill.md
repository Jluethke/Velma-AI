# Api Metric Definer

Define the API metrics to monitor.

## Inputs

- `api-inventory`: The APIs to monitor
- `sla-targets`: The SLA targets (uptime, latency, error rate)

## Outputs

- `metric-definitions`: Defined metrics: request rate, latency percentiles (p50, p95, p99), error rate by code, availability
- `sli-slo-mapping`: SLIs mapped to SLOs for each API (e.g., p99 latency under 500ms, error rate under 0.1%)

## Process

1. Define the golden signals: latency, traffic, errors, saturation.
2. For each API, set the SLIs (what to measure) and SLOs (what targets to hit).
3. Define the latency percentiles to track (p50 for typical, p95 for slow, p99 for worst case).
4. Define the error rate breakdown (by HTTP status code, by error type).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
