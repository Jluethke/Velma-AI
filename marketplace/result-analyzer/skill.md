# Result Analyzer

On the analysis date, evaluate the result. There are three possible conclusions: the effect is real (reject the null), the effect is not detectable at this size (fail to reject the null), or the data is insufficient (the experiment failed logistically). State the conclusion clearly.

## Inputs

- `hypothesis-statement`: The prediction
- `analysis-schedule`: The pre-committed analysis plan

## Outputs

- `experiment-result`: The observed effect, the confidence interval, the p-value, and the conclusion (real effect, no effect, or inconclusive)
- `decision-recommendation`: Based on the result: implement the change, do not implement, or run a larger experiment

## Process

1. Calculate the observed effect (difference between test and control, or before and after). Calculate the 95% confidence interval around the effect.
2. If the confidence interval does not include zero, the effect is statistically significant at the chosen alpha level. If it does include zero, the data does not support the hypothesis at this sample size.
3. State the practical significance: even if statistically significant, is the observed effect large enough to matter? A 0.1% increase in click-through rate may be statistically real but not worth implementing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
