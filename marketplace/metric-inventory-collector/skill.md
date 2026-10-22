# Metric Inventory Collector

List every metric currently tracked, across all systems and dashboards. Most organizations (and individuals) track 5-10x more metrics than they act on. The inventory is the first step to finding the dead weight.

## Inputs

- `data-sources`: List of dashboards, spreadsheets, reports, and tracking systems in use
- `scope-boundary`: The team, project, or life area to inventory

## Outputs

- `metric-inventory`: Every metric tracked, with its source system, update frequency, and current value
- `inventory-count`: Total number of metrics found

## Process

1. Walk through each data source and extract every named metric, KPI, or tracked number. Include informal ones (the number someone checks in a spreadsheet every Monday).
2. For each metric, record: name, source system, update frequency, current value, and who looks at it.
3. Do not filter or judge yet. The goal is a complete list, not a clean one.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
