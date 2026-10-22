# Risk Score Calculator

Calculate the risk score (probability times impact) for each risk and rank them. The ranking determines where to spend mitigation effort.

## Inputs

- `probability-ratings`: Each risk with its probability rating
- `impact-ratings`: Each risk with its impact rating

## Outputs

- `scored-risk-list`: Each risk with its probability, impact, and composite score, sorted highest to lowest
- `risk-tiers`: Risks grouped into tiers: critical (score 15-25), high (score 8-14), medium (score 4-7), low (score 1-3)

## Process

1. Multiply the probability rating by the impact rating for each risk to produce the composite score.
2. Sort the list from highest score to lowest. Ties break by impact (higher impact wins because the consequence is harder to absorb).
3. Group into tiers: critical (15-25), high (8-14), medium (4-7), low (1-3). Critical and high tiers require a mitigation plan. Medium tiers require a monitoring plan. Low tiers are accepted.
4. Flag any risk where either dimension is a 5, regardless of the composite score. A 1-probability, 5-impact risk (rare but existential) needs a contingency plan even if the composite score is only 5.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
