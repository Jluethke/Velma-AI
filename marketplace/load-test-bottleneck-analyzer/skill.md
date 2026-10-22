# Load Test Bottleneck Analyzer

Analyze load test results to identify specific bottlenecks causing performance degradation.

## Inputs

- `ramp-results`: Performance metrics across all load levels
- `baseline-profile`: Resource utilization at baseline

## Outputs

- `bottleneck-findings`: Identified bottlenecks with evidence
- `resource-saturation-map`: Map of which resources saturate first

## Process

1. Correlate performance degradation with resource utilization spikes
2. Identify which component saturates first (CPU, memory, database, network)
3. Trace slow requests to specific services or queries
4. Document each bottleneck with supporting metrics

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
