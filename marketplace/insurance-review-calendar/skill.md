# Insurance Review Calendar

Set up the annual insurance review calendar tied to policy renewal dates.

## Inputs

- `policy-inventory`: All active policies with renewal dates
- `coverage-action-plan`: The prioritized changes

## Outputs

- `review-calendar`: A calendar of review dates (30 days before each renewal) with the checklist for each review
- `insurance-audit-document`: The complete audit: risk inventory, coverage map, gaps, overlaps, action plan, and review calendar

## Process

1. For each policy, set a review date 30 days before renewal. At that review: re-assess the covered risks (have they changed?), compare the premium to alternatives, and check for new exclusions.
2. Set one annual full review (regardless of individual renewal dates) to re-run the risk inventory and coverage mapping.
3. Compile the complete audit document. Store it where it can be found by someone other than you.
4. If the audit reveals that you are spending more than 5% of income or revenue on insurance, review whether the deductibles are set too low (raising deductibles saves premium for risks you can self-insure).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
