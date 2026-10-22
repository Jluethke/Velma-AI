# Observability Requirements Definer

Define observability requirements across the three pillars: metrics, logs, and distributed traces.

## Inputs

- `service-catalog`: List of services and their dependencies
- `reliability-goals`: SLOs, alerting needs, and debugging requirements

## Outputs

- `observability-requirements`: Requirements for metrics, logs, and traces
- `data-retention-policy`: Retention periods for each data type

## Process

1. Define the metrics needed per service (latency, error rate, saturation)
2. Define the logging requirements (structured format, fields, levels)
3. Define the tracing requirements (span coverage, sampling rate)
4. Set data retention periods for each observability pillar

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
