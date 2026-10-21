# Process Monitoring Report

Compile the multivariate process monitoring results into a report with control charts, contribution analysis, and recommendations.

## Inputs

- `monitoring-results`: T-squared and Q time series with alarms
- `contribution-plots`: Variable contributions for each alarm event
- `root-cause-candidates`: Diagnosed root causes

## Outputs

- `monitoring-report`: Process monitoring report with control charts, fault diagnosis, and recommendations
- `monitoring-data-archive`: Model, limits, monitoring data, and contribution analysis for archival

## Process

1. Generate control chart figures with alarm annotations
2. Compile contribution plots for each significant alarm event
3. Write a summary of detected faults, their root causes, and process impact
4. Recommend corrective actions or model updates based on the findings

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
