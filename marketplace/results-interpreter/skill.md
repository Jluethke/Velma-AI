# Results Interpreter

Interpret statistical output in terms of the original hypothesis, assess effect sizes, identify unexpected patterns, and state what the data do and do not support.

## Inputs

- `analysis-plan`: The pre-registered analysis pipeline
- `significance-thresholds`: Decision criteria for acceptance or rejection
- `prediction-set`: What was predicted under the hypothesis

## Outputs

- `results-narrative`: Plain-language interpretation of each test outcome
- `effect-size-table`: Observed effect sizes with confidence intervals
- `limitations-list`: Caveats, confounds, and generalizability boundaries

## Process

1. Run each pre-registered test and record the output
2. Compare observed results against each prediction
3. Calculate and report effect sizes with confidence intervals
4. Identify patterns not predicted by the hypothesis
5. List limitations, confounds, and threats to validity

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
