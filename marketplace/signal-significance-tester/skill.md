# Signal Significance Tester

Test whether the anomaly is statistically significant against the null hypothesis of noise, drift, or expected variability.

## Inputs

- `anomaly-profile`: Quantitative characterization of the anomaly
- `context-summary`: Summary of surrounding data behavior

## Outputs

- `significance-result`: p-value, confidence interval, or Bayes factor for the anomaly
- `test-details`: Which test was used and why, with assumptions stated

## Process

1. Select the appropriate statistical test given the data distribution and anomaly type.
2. Define the null hypothesis (the anomaly is a fluctuation of the background).
3. Compute the test statistic and its probability under the null.
4. Report the result with effect size and confidence bounds.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
