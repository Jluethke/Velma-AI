# Elimination Decision Maker

For each piece of debt, decide: eliminate entirely, simplify (reduce the frequency or scope), or keep (the cost is justified by a reason the team had not articulated). The default should be eliminate. Most organizations keep processes because of inertia, not because of a conscious decision.

## Inputs

- `debt-cost-table`: Annual cost of each debt item
- `total-debt-cost`: Total annual cost of organizational debt

## Outputs

- `elimination-decisions`: For each debt item: eliminate, simplify (with the specific simplification), or keep (with the justification)
- `freed-capacity`: The total hours per year freed by eliminating and simplifying, converted to FTE equivalents

## Process

1. For each item, start with the assumption that it should be eliminated. The burden of proof is on keeping it, not on eliminating it.
2. If someone argues to keep it, ask: what specifically would go wrong if we stopped doing this? If the answer is vague ('things might fall through the cracks'), propose a 30-day trial elimination and monitor for actual problems.
3. For items that cannot be eliminated entirely, simplify: reduce the frequency (weekly to monthly), reduce the scope (full report to dashboard), or reduce the participants (whole team to 2 people).
4. Calculate the freed capacity: total hours per year saved by eliminations and simplifications, divided by 2,000 (working hours per year) equals FTE equivalents recovered.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
