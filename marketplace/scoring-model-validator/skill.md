# Scoring Model Validator

Validate the model against historical default rates and produce the model document.

## Inputs

- `score-bands`: Defined score bands and thresholds
- `weighted-model`: The scoring formula and weights

## Outputs

- `validation-results`: Model performance metrics (KS statistic, Gini, accuracy by band)
- `scoring-model-document`: Complete model documentation for regulatory and internal use

## Process

1. Score the historical population using the model.
2. Compare predicted risk by band against actual default rates.
3. Calculate discrimination metrics (KS, Gini, ROC).
4. Document the model, validation results, and any limitations.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
