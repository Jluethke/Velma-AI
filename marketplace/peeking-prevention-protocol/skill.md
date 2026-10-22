# Peeking Prevention Protocol

Set the rules for when you are allowed to look at the results. The most common experiment failure is peeking at the data before the sample size is reached and stopping when it looks good. This inflates the false positive rate from 5% to as high as 30%.

## Inputs

- `required-observations`: How many observations are needed
- `estimated-runtime`: How long the experiment runs

## Outputs

- `analysis-schedule`: The specific date (or observation count) when the results will be analyzed, and the rule that no conclusions are drawn before then
- `early-stopping-rules`: If early stopping is necessary (safety or ethics), the corrected thresholds that account for multiple looks

## Process

1. Set the analysis date: the date when the required sample size will be reached. Write it down. Commit to not looking at the metric comparison before this date.
2. If you must look early (safety monitoring, ethical concerns), apply a correction: divide alpha by the number of planned looks (Bonferroni) or use a sequential testing framework (alpha spending function). Two looks means each look uses alpha/3 (stricter than alpha/2 due to correlation).
3. Remove access to the comparison data during the experiment if possible. If not possible, assign a different person to monitor for safety issues, and keep the experimenter blinded.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
