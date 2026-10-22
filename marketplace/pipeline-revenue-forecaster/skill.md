# Pipeline Revenue Forecaster

Forecast revenue by applying stage probabilities to the pipeline.

## Inputs

- `stage-probabilities`: Win probability per stage
- `deal-list`: Deals with values and stages

## Outputs

- `weighted-forecast`: Expected revenue by period
- `forecast-confidence`: Confidence range based on pipeline coverage

## Process

1. Multiply each deal value by its stage probability.
2. Sum weighted values by close date period.
3. Calculate pipeline coverage ratio against target.
4. Produce confidence intervals for each period.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
