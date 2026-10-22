# Next Intervention Cycle

After the first upstream fix, re-audit the remaining symptoms and select the next highest-leverage intervention.

## Inputs

- `fix-implementation`: The change that was made
- `symptom-tracking-plan`: Tracking results showing which symptoms decreased

## Outputs

- `updated-symptom-list`: The remaining symptoms after the first fix, re-scored by frequency and cost
- `next-intervention`: The next highest-leverage upstream intervention point to address

## Process

1. Re-measure all symptoms. Some should have decreased. Others may be unchanged. A few may have increased (the fix may have shifted load).
2. Remove eliminated symptoms from the list. Recalculate the total firefighting cost with the remaining symptoms.
3. Re-run the leverage scoring on the remaining root causes. The rankings may have shifted because fixing one root cause sometimes weakens another root cause's impact.
4. Select the next intervention and repeat the cycle. Over time, each upstream fix reduces the total firefighting load, freeing capacity for proactive work instead of reactive work.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
