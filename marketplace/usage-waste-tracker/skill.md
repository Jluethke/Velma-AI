# Usage Waste Tracker

Track daily ingredient usage and waste to identify variance.

## Inputs

- `par-levels`: Established par levels
- `daily-production-log`: What was prepared and served each day

## Outputs

- `usage-report`: Daily usage by ingredient vs expected
- `waste-log`: Waste by category (spoilage, over-prep, plate waste)

## Process

1. Record actual usage per ingredient per shift.
2. Log all waste by category and cause.
3. Compare actual usage against theoretical usage.
4. Flag items with variance above threshold.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
