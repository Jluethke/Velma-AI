# Confound Classifier

For each confounding variable, select the control strategy: hold constant, match across groups, measure and adjust statistically, or block and randomize.

## Inputs

- `confound-list`: Identified confounders with potential effects
- `variable-registry`: All variables with classifications

## Outputs

- `confound-control-plan`: Each confounder matched to a control strategy
- `residual-confounds`: Confounders that cannot be fully controlled, with mitigation notes

## Process

1. For each confounder, evaluate whether it can be held constant across conditions.
2. If not constant, check whether subjects can be matched or blocked on it.
3. If matching is impractical, plan to measure it and adjust statistically.
4. Flag any confounders that remain uncontrolled and note the residual risk.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
