# Confidence Quantifier

Rate the overall confidence in each synthesized conclusion using a structured framework (GRADE, CERQual, or adapted).

## Inputs

- `convergence-map`: evidence clusters per conclusion
- `resolution-table`: resolved and unresolved contradictions
- `weighted-evidence-table`: quality ratings

## Outputs

- `confidence-ratings`: high/moderate/low/very-low confidence per conclusion with contributing factors
- `downgrade-upgrade-log`: reasons for downgrading (bias, inconsistency, imprecision, indirectness) or upgrading (large effect, dose-response)

## Process

1. Start each conclusion at high confidence and apply downgrade criteria: risk of bias, inconsistency, indirectness, imprecision, publication bias
2. Apply upgrade criteria where appropriate: large effect, dose-response gradient, all plausible confounding would reduce effect
3. Assign the final confidence level and document the path from high to the assigned rating
4. Produce the summary of findings table with conclusion, evidence base, and confidence rating

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
