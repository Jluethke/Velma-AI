# Discrepancy Resolver

Investigate and resolve unmatched or discrepant items.

## Inputs

- `unmatched-items`: Items without a match
- `matched-transactions`: Context of what did match

## Outputs

- `resolution-actions`: Actions taken for each discrepancy (timing, adjustment, error)
- `reconciliation-report`: Final reconciliation report with matched, resolved, and outstanding items

## Process

1. Classify each discrepancy (timing difference, fee, error, missing record).
2. Investigate and resolve each item or escalate for further review.
3. Compile the final reconciliation report with all matched, resolved, and outstanding items.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
