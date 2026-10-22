# Dashboard Rebuild Plan

Produce the rebuild plan: the surviving metrics, their visualizations, their layout, and the metrics that were removed. The rebuilt dashboard will be smaller, faster to read, and every number on it will be connected to a decision.

## Inputs

- `visualization-assessment`: The surviving metrics with their recommended visualizations
- `no-action-metrics`: The metrics being removed
- `layout-recommendations`: How to arrange the dashboard

## Outputs

- `dashboard-rebuild-spec`: The specification for the rebuilt dashboard: which metrics, which visualizations, which layout, and the action protocol for each metric
- `removed-metrics-archive`: The metrics removed, with the reason, archived in case someone asks about them later

## Process

1. Write the rebuild spec: for each metric, state the name, the question it answers, the visualization type, the update frequency, and the action triggered when it moves.
2. Archive the removed metrics with the reason: 'no action taken in 90+ days,' 'frequency mismatched and not adjustable,' or 'redundant with another metric.'
3. Set a review date (90 days) to check whether the rebuilt dashboard is being used as designed. If metrics are being added back, require them to pass the last-action test before they go on.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
