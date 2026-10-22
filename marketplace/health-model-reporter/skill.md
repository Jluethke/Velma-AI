# Health Model Reporter

Produce the health scoring model documentation.

## Inputs

- `automated-scoring`: Running scoring pipeline
- `alert-rules`: Active alert configuration

## Outputs

- `health-scoring-model`: Complete health scoring model document
- `model-validation-report`: Validation results against historical churn

## Process

1. Document the full scoring model with indicators, weights, and thresholds.
2. Run the model against historical data and report accuracy.
3. Define the model review cadence.
4. Produce the health scoring model document.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
