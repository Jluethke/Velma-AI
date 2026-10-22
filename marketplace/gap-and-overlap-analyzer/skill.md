# Gap And Overlap Analyzer

Identify coverage gaps (uncovered risks above the damage threshold) and overlaps (duplicate coverage for the same risk).

## Inputs

- `coverage-map`: The risk-to-policy mapping
- `insurable-risk-list`: The risks with maximum plausible losses

## Outputs

- `coverage-gaps`: Risks above the damage threshold with no coverage or with coverage limits below 50% of the maximum plausible loss
- `coverage-overlaps`: Risks covered by multiple policies, with the combined premium cost and whether one policy could be dropped

## Process

1. For each risk, compare the coverage limit to the maximum plausible loss. If coverage is zero, it is a gap. If coverage is less than 50% of the maximum loss, it is an underinsurance gap.
2. For each risk covered by multiple policies, identify which policy is primary and which is excess. If both are primary, you are paying duplicate premiums for the same first-dollar coverage.
3. Rank gaps by the uninsured exposure (maximum plausible loss minus coverage limit), highest first.
4. Rank overlaps by the premium savings available from eliminating the duplicate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
