# Capacity Plan Builder

Build the capacity plan: what to add, when to order it, when it comes online, and what triggers the next round of planning.

## Inputs

- `capacity-options`: Available capacity additions
- `critical-date`: When capacity must arrive
- `load-growth-rate`: Growth trajectory

## Outputs

- `capacity-plan`: Timeline of capacity additions with trigger dates, costs, and expected utilization after each addition
- `review-triggers`: Conditions that trigger a re-plan (load growth accelerates, a new product launches, a major customer signs)

## Process

1. Select the capacity additions that bring utilization below 80% before the critical date. Include a buffer for implementation delays.
2. Schedule future additions based on the load growth rate. Each addition should bring utilization to around 60%, buying time before the next addition is needed.
3. Define review triggers: if load grows faster than projected, or if a known event (product launch, seasonal peak, acquisition) will spike demand, re-plan immediately.
4. The capacity plan is a living document. Review it at the frequency of your shortest lead time.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
