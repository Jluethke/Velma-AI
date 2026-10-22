# Prescriber Discrepancy Resolver

Resolve each discrepancy with the prescribing provider.

## Inputs

- `discrepancy-list`: Identified discrepancies
- `interaction-alerts`: Drug interaction alerts

## Outputs

- `resolved-actions`: Decision for each discrepancy (continue, modify, discontinue)
- `clinical-rationale`: Documented reason for each decision

## Process

1. Present each discrepancy to the prescriber with context.
2. Obtain a decision: continue, modify, or discontinue.
3. Document the clinical rationale for each resolution.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
