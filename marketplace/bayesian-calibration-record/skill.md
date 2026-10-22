# Bayesian Calibration Record

Record the full Bayesian analysis for calibration tracking. This feeds into the decision journal. Over time, you can check whether your priors are well-calibrated and whether your update rules match reality.

## Inputs

- `stated-prior`: The starting prior
- `evidence-log`: All evidence and updates
- `decision`: The final decision

## Outputs

- `bayesian-record`: The complete record: prior, evidence, updates, posterior, decision, and outcome check date
- `outcome-check-date`: When to check the outcome against the posterior prediction

## Process

1. Compile the full record: hypothesis, prior, each piece of evidence with its update, the posterior, the decision, and the reasoning.
2. Set an outcome check date to compare the prediction to reality.
3. At the check date, record whether the outcome matched the posterior. Feed this into the calibration analysis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
