# Security Metric Definer

Define the key security operations metrics aligned with program objectives.

## Inputs

- `program-objectives`: Security program goals and stakeholder reporting requirements
- `available-data-sources`: Inventory of security tools, logs, and ticketing systems with available data

## Outputs

- `metric-definitions`: Each metric with name, formula, data source, and collection frequency
- `metric-priority-list`: Metrics ranked by importance for the initial dashboard

## Process

1. Define operational metrics: MTTD, MTTR, alert volume, false positive rate, escalation rate
2. Define coverage metrics: detection coverage by ATT&CK technique, vulnerability scan coverage, patch compliance
3. Define program metrics: risk reduction over time, incident trend, training completion
4. Rank by stakeholder need and data availability

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
