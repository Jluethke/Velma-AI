# Observability Tooling Selector

Select the observability tools for metrics, logs, and traces based on requirements and budget.

## Inputs

- `observability-requirements`: Requirements for each pillar
- `infrastructure-context`: Cloud provider, scale, and existing tooling

## Outputs

- `tooling-selection`: Selected tools for metrics, logs, and traces
- `integration-plan`: Plan for integrating the tools together

## Process

1. Evaluate metrics tools (Prometheus, Datadog, CloudWatch, Grafana Mimir)
2. Evaluate log aggregation (Loki, Elasticsearch, CloudWatch Logs, Splunk)
3. Evaluate tracing (Jaeger, Tempo, X-Ray, Honeycomb)
4. Select the combination that meets requirements within budget

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
