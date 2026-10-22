# Physical Count Reconciler

Conduct and reconcile weekly physical inventory counts.

## Inputs

- `receiving-log`: Items received since last count
- `usage-report`: Usage since last count

## Outputs

- `count-reconciliation`: Physical vs book inventory comparison
- `inventory-variance`: Variance by item with possible causes

## Process

1. Count every item in storage by weight or unit.
2. Compare physical count against the book inventory.
3. Identify and investigate significant variances.
4. Adjust the book inventory to match the count.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
