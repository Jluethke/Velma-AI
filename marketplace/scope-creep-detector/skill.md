# Scope Creep Detector

Detect scope creep before it accumulates. Scope creep is the sum of small, unvetted additions that individually seem harmless.

## Inputs

- `in-scope-list`: The original agreed scope
- `change-request`: The change request log

## Outputs

- `scope-drift-report`: The cumulative scope added since the baseline, with the total impact on time, cost, and quality
- `scope-creep-alerts`: Alerts for: unapproved additions found in the work product, cumulative additions exceeding 10% of original scope, and changes made without going through the change request process

## Process

1. Compare the current work product to the original scope baseline. Identify anything being built that was not in the original in-scope list and was not approved through a change request.
2. Calculate the cumulative impact: all approved changes plus any unapproved additions. Express as a percentage of the original scope.
3. If cumulative additions exceed 10% of original scope, trigger a scope re-baselining: the stakeholders must formally agree to the expanded scope with the updated constraints.
4. If unapproved additions are found, trace them to the person who added them. This is not blame; it is process feedback. The addition may be valid but it must go through the evaluation process.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
