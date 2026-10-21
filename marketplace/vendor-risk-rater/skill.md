# Vendor Risk Rater

Rate the overall vendor risk from the control findings, the data exposure, and the likelihood and impact of each shortfall.

## Inputs

- `control-evaluation`: Per-control ratings with supporting evidence.
- `finding-list`: The specific control shortfalls identified.

## Outputs

- `risk-rating`: Overall vendor risk tier with per-finding severity scores.
- `risk-justification`: Written rationale linking each score to the finding, the data exposure, and the likely impact.

## Process

1. Score each finding by likelihood and by impact on the data it touches.
2. Roll the finding scores into an overall vendor risk tier.
3. Write the rationale that ties each score to the evidence and the data exposure.
4. Call out any single finding severe enough to block the engagement on its own.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
