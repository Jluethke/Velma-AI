# Intervention Design

For each high-velocity category, design an intervention that reduces the velocity, not just the level.

## Inputs

- `projections`: Where expenses are headed
- `budget-breach-dates`: When they hit limits

## Outputs

- `interventions`: For each high-velocity category: a specific action that addresses the CAUSE of the growth, not just the current level
- `target-velocity`: The target growth rate for each category after intervention (ideally 0% or negative)

## Process

1. Identify WHY the expense is growing. Common causes: usage creep (more people using a tool), price increases from the vendor, scope creep (doing more without realizing), or lifestyle inflation (spending more because you earn more).
2. Address the cause, not the symptom. Cutting the expense this month does not help if the velocity remains high. Next month it grows right back.
3. Set a target velocity for each category. Some categories should be flat (0% growth). Some should shrink (negative velocity). Very few should be allowed to grow unchecked.
4. Implement the intervention and continue tracking velocity monthly. If the velocity does not decrease within 2 months, the intervention was insufficient.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
