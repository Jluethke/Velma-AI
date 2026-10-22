# Three Level Layout Designer

Build the three-level hierarchy: summary, diagnostic, investigative.

## Inputs

- `information-requirements`: The ranked questions
- `dashboard-purpose`: The audience and cadence

## Outputs

- `dashboard-layout`: The three levels: summary (1-3 headline numbers), diagnostic (breakdown charts), investigative (detail tables)
- `element-justifications`: For each element: the question it answers. Elements without a question are removed.

## Process

1. Summary level: 1-3 numbers visible at a glance. Large text, color coding, trend arrows. State visible in under 5 seconds.
2. Diagnostic level: breakdown by segment, time period, or category. Charts showing comparison.
3. Investigative level: detail tables, drill-downs. Only visible when the reader drills down.
4. Every element must answer a listed question. If it does not, remove it.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
