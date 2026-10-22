# Conclusion Evaluator

When the sample size is reached, evaluate the result. Either the signal exceeded the noise threshold (the effect is real) or it did not (the data is inconclusive or the effect does not exist at the size you cared about). There are only these two conclusions.

## Inputs

- `measurement-commitment`: The locked plan with the pre-defined thresholds
- `metric-name`: The metric being evaluated, for the final report

## Outputs

- `conclusion`: Whether the effect is real (signal detected), not real (no signal at the defined effect size), or inconclusive (insufficient data despite the plan)
- `measurement-report`: The full report: hypothesis, sample size, duration, observed effect, confidence interval, and conclusion

## Process

1. Calculate the observed effect (the difference between the groups or the trend magnitude). Calculate the confidence interval around it.
2. If the confidence interval excludes zero (for a difference) or excludes the null hypothesis, the effect is real at the chosen confidence level. If it includes zero, the data does not support a conclusion that the effect exists.
3. Write the report: state the hypothesis, the observed result, the confidence interval, and the conclusion. Do not say 'the effect was not significant' when you mean 'we did not have enough data.' Those are different statements.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
