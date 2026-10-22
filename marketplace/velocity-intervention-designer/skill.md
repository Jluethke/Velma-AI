# Velocity Intervention Designer

Design a specific intervention for each high-velocity category based on its growth driver.

## Inputs

- `top-velocity-categories`: The 3 categories with their growth drivers
- `growth-driver-analysis`: Whether each is driven by frequency, amount, or scope
- `total-cost-impact`: The projected cost if no action is taken

## Outputs

- `intervention-plans`: A specific, actionable intervention for each high-velocity category, tailored to its growth driver
- `expected-savings`: The projected savings from each intervention over 1 year, calculated against the do-nothing projection

## Process

1. For frequency-driven growth: design a constraint. Set a maximum number of transactions per month for that category. Calculate what the monthly cost would be at the reduced frequency.
2. For amount-driven growth: design a substitution. Identify a lower-cost alternative for the most common transactions in the category. Calculate the savings from switching the top 3 transactions to the alternative.
3. For scope-driven growth: design a purge. List every payee that appeared in the last 3 months but not in the 3 months before that. For each new payee, decide: keep (it replaced something), cut (it's pure addition), or reduce (lower the frequency).
4. For each intervention, calculate the expected monthly savings by comparing the projected amount (at current growth rate) to the projected amount (with the intervention applied). Annualize the savings.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
