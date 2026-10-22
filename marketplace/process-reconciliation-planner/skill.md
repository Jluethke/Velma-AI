# Process Reconciliation Planner

Reconcile the documented process with reality. Sometimes the actual process is better (adopt it). Sometimes the documented process is right but people cannot follow it (fix the barriers). Sometimes both are wrong (redesign).

## Inputs

- `gap-list`: Documented vs. actual differences
- `gap-root-causes`: Why each gap exists

## Outputs

- `reconciliation-plan`: For each gap: adopt the actual, fix the barriers to the documented, or redesign. With the specific action for each.
- `updated-process`: The reconciled process that matches both what works and what is documented

## Process

1. For workarounds: if the workaround produces a better outcome, adopt it as the official process. If not, fix the barrier that makes the official way impractical.
2. For rework loops: fix the upstream quality failure that causes the rework. Do not document the rework loop as part of the process.
3. For missing steps: add them to the documentation. For extra steps: remove them from the documentation.
4. Publish the reconciled process and retire the old version. Test it using the naive-user method from the standard-procedure-builder chain.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
