# Upstream Fix Implementation

Implement the upstream fix and measure whether the downstream symptoms actually decrease.

## Inputs

- `top-intervention`: The highest-leverage intervention point
- `symptom-list`: The symptoms expected to decrease

## Outputs

- `fix-implementation`: The specific change made at the upstream intervention point
- `symptom-tracking-plan`: How to measure the frequency and cost of the downstream symptoms over the next 30-60 days

## Process

1. Design the specific change at the intervention point. If the root cause is 'no written specification for handoffs,' the fix is: write the specification, review it with both teams, and make it the required format for all handoffs.
2. Implement the change. Communicate what changed and why to everyone affected.
3. Set up tracking for all symptoms that this root cause was supposed to drive. Measure their frequency and cost for 30-60 days after the fix.
4. If the symptoms decrease as expected, the root cause analysis was correct. If not, either the fix was insufficient or the causal chain was wrong. Revisit the analysis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
