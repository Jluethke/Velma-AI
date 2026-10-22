# Lifecycle Stage Definer

Define the stages of the subscriber lifecycle and the triggers between them.

## Inputs

- `business-model`: How the business makes money (product sales, SaaS, services, content)
- `subscriber-data`: Available data points on subscribers (sign-up source, behavior, purchase history)

## Outputs

- `lifecycle-stages`: Named stages (new, engaged, customer, at-risk, dormant, churned) with entry and exit criteria
- `stage-triggers`: Events that move a subscriber from one stage to the next

## Process

1. Define each lifecycle stage based on engagement and purchase behavior.
2. Set the entry criteria for each stage (e.g., 'at-risk' = no open in 30 days).
3. Set the exit criteria (what moves them to the next stage or back to a prior one).
4. Map the triggers: which event fires which automation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
