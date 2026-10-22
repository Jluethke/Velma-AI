# Qualification Decision Maker

Score the opportunity and make a go/no-go recommendation.

## Inputs

- `bant-assessment`: BANT scores
- `competitive-assessment`: Competitive position
- `risk-register`: Deal risks and mitigations

## Outputs

- `qualification-score`: Composite score for the opportunity
- `qualification-assessment`: Go/no-go recommendation with rationale

## Process

1. Compute the composite qualification score from BANT, competitive, and risk scores.
2. Apply the qualification threshold.
3. Write the recommendation (pursue, deprioritize, or disqualify).
4. Document the rationale and any conditions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
