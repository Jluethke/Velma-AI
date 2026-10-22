# Inter Rater Calibrator

Calibrate the rubric across multiple raters to establish inter-rater reliability.

## Inputs

- `weighted-rubric`: Rubric with dimension weights assigned
- `pilot-results`: Scores and notes from pilot testing

## Outputs

- `calibrated-rubric`: Revised rubric after calibration
- `reliability-score`: Inter-rater reliability metric (e.g., Cohen's kappa)

## Process

1. Have 2-3 raters independently score the same samples
2. Compute inter-rater agreement (Cohen's kappa or percentage agreement)
3. Discuss and resolve disagreements
4. Revise descriptors that caused inconsistent scoring

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
