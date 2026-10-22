# As Built Drawing Collector

Collect and verify as-built drawings from all trades.

## Inputs

- `project-name`: Name of the construction project
- `drawing-list`: List of all project drawings requiring as-built markup

## Outputs

- `as-built-drawings`: Complete set of as-built drawings
- `drawing-gaps`: Any drawings not yet received

## Process

1. Request as-built markups from each subcontractor.
2. Verify that each drawing reflects the actual installed conditions.
3. Track receipt and flag missing drawings.
4. Submit the as-built set to the architect for final review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
