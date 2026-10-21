# Security Query Layer Designer

Design the query and analysis layer for threat hunting, alerting, and compliance reporting.

## Inputs

- `storage-architecture`: Where data lives and how it is structured
- `normalization-schema`: Common event schema
- `detection-requirements`: Use cases to support

## Outputs

- `query-layer-design`: Query interfaces, scheduled queries, dashboards, and notebook integrations
- `detection-rule-framework`: How detection rules are written, tested, and deployed against the data lake

## Process

1. Design the query interface for analysts (SQL, KQL, SPL, or custom DSL)
2. Build scheduled query infrastructure for detection rules
3. Integrate with notebook environments for threat hunting (Jupyter, Observable)
4. Design dashboards for operational monitoring and compliance reporting

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
