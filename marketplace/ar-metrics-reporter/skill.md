# Ar Metrics Reporter

Report on accounts receivable metrics: DSO, aging distribution, and collection rates.

## Inputs

- `aging-report`: Current aging report
- `applied-payments`: Payment application data for the period

## Outputs

- `ar-metrics-report`: AR metrics report with DSO, aging, and collection rates
- `trend-comparison`: Trend comparison against prior periods

## Process

1. Calculate days sales outstanding (DSO) for the period.
2. Compute the aging distribution as a percentage of total receivables.
3. Calculate collection rates and effectiveness metrics.
4. Compare to prior periods and identify trends.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
