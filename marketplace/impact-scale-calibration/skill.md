# Impact Scale Calibration

Build an anchored impact scale using dollar equivalents (or time equivalents for personal risks) so that ratings are comparable across different types of risk.

## Inputs

- `specific-risk-statements`: The filtered list of specific risk statements
- `scope-description`: The context for calibrating the scale

## Outputs

- `calibrated-impact-scale`: A 1-5 impact scale where each level is anchored to a dollar amount, time period, or concrete operational consequence
- `impact-ratings`: Each risk rated on the calibrated scale with a one-sentence justification

## Process

1. Define the 5 levels with concrete anchors tied to the scope. For a business: 1 = less than 1 week of revenue; 2 = 1 to 4 weeks of revenue; 3 = 1 to 3 months of revenue; 4 = 3 to 12 months of revenue; 5 = existential (bankruptcy, closure, irrecoverable). For personal: substitute monthly income.
2. For each risk, estimate the financial or time impact if the risk materializes. Map it to the closest anchor.
3. Consider second-order impacts: a data breach costs money to remediate AND costs reputation. Rate the combined impact.
4. Document the final rating and the justification for each risk.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
