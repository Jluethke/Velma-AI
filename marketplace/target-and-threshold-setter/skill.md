# Target And Threshold Setter

Set targets and alerting thresholds for each KPI.

## Inputs

- `kpi-list`: Defined KPIs
- `data-source-map`: Data sources for each KPI

## Outputs

- `targets-and-thresholds`: Target value, warning threshold, and critical threshold per KPI
- `alert-rules`: When and how alerts fire

## Process

1. Set the target value for each KPI based on business goals.
2. Set warning and critical thresholds (percent deviation from target, absolute value, trend direction).
3. Define who receives alerts and through what channel.
4. Produce the targets, thresholds, and alert rules.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
