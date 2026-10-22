# Calibration Pattern Analyzer

After 10 or more entries have outcome data, analyze the calibration patterns. Are your 80% confidence predictions right 80% of the time, or only 50%? Do you systematically over- or under-estimate timelines? Are you better at certain types of decisions than others? The patterns reveal your specific cognitive biases.

## Inputs

- `outcome-record`: All journal entries with outcome comparisons (at least 10)

## Outputs

- `calibration-report`: Your calibration curve: for each confidence level, how often you were actually right
- `bias-patterns`: Systematic biases identified (overconfidence, optimism bias, domain-specific weaknesses, etc.)

## Process

1. Group entries by confidence level (55-65%, 65-75%, 75-85%, 85-95%).
2. For each group, calculate the actual accuracy rate. If your 80% bucket is right only 55% of the time, you are overconfident.
3. Look for domain patterns: are you better calibrated on technical decisions than people decisions, or vice versa?
4. Look for direction patterns: do you consistently over-estimate or under-estimate timelines, costs, or adoption rates?
5. Identify your strongest and weakest decision categories.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
