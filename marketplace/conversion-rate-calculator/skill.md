# Conversion Rate Calculator

Calculate historical stage-to-stage conversion rates.

## Inputs

- `deal-history`: Historical deals with stage progression
- `pipeline-snapshot`: Current pipeline for comparison

## Outputs

- `conversion-rates`: Historical conversion rates by stage
- `trend-analysis`: Whether rates are improving or declining

## Process

1. Calculate the win rate from each stage over the past four quarters.
2. Identify any trends in conversion rates.
3. Segment rates by deal size and segment if sample size allows.
4. Flag stages where current pipeline behavior differs from historical.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
