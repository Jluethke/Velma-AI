# Trial Statistical Report

Analyze the trial data using mixed models, compute entry means, heritability, and genetic gain, and produce the trial report.

## Inputs

- `yield-data`: Plot-level yield and yield component data
- `phenotype-data`: All scored trait data
- `environment-log`: Environmental covariates for the growing season

## Outputs

- `trial-report`: Statistical summary with entry means, LSD, heritability, and genetic gain estimates
- `selection-recommendations`: Entries recommended for advancement, discard, or retesting

## Process

1. Fit a mixed model with entry as fixed or random, replicate and block as random
2. Estimate entry means (BLUPs or BLUEs), LSD, and broad-sense heritability
3. Calculate predicted genetic gain for the selection intensity applied
4. Rank entries and flag those exceeding the check mean for advancement

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
