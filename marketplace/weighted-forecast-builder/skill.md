# Weighted Forecast Builder

Apply weighted pipeline methodology to produce the forecast.

## Inputs

- `pipeline-snapshot`: Current pipeline data
- `conversion-rates`: Stage conversion rates

## Outputs

- `weighted-forecast`: Expected revenue by period
- `scenario-models`: Best, likely, and worst case forecasts

## Process

1. Multiply each deal by its stage-specific conversion rate.
2. Sum by forecast period to get the likely case.
3. Apply upside rates for the best case and downside rates for the worst.
4. Calculate the spread between scenarios.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
