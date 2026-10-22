# Risk Proximity Tracker

Track how close each risk is to materializing. A risk that could hit in 2 weeks needs different attention than one that could hit in 6 months.

## Inputs

- `current-risk-register`: The updated risk register
- `project-timeline`: The remaining project timeline and milestones

## Outputs

- `risk-proximity-map`: Each risk with its proximity: how many weeks until it could materialize (immediate, near-term: 1-4 weeks, mid-term: 1-3 months, distant: 3+ months)
- `approaching-risk-alerts`: Risks that moved from mid-term to near-term since the last scan, requiring immediate mitigation planning

## Process

1. For each risk, estimate the earliest it could materialize: is the trigger event days away, weeks away, or months away?
2. Classify by proximity: immediate (could happen this week), near-term (1-4 weeks), mid-term (1-3 months), distant (3+ months).
3. Flag any risk that moved closer since the last scan. A risk that was distant and is now near-term is accelerating.
4. Prioritize mitigation by proximity: an imminent high-impact risk demands action now, regardless of whether a distant higher-score risk exists.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
