# Data Collection Commitment

Commit to the measurement plan before starting. The most common failure mode in measurement is peeking at the data before the sample size is reached and making a premature conclusion. This step locks the plan.

## Inputs

- `required-sample-size`: How many observations you need
- `required-duration`: How long the measurement will take

## Outputs

- `measurement-commitment`: The locked plan: what you are measuring, the sample size, the end date, and the rule that you will not conclude anything before the end date
- `interim-check-rules`: If you must check early (safety concerns), the stopping rules that account for multiple looks at the data

## Process

1. Write the commitment: 'I will collect N observations over D days/weeks. I will not draw a conclusion before then. On the end date, I will evaluate the result using the pre-defined thresholds.'
2. If early stopping is necessary (for safety or ethical reasons), apply the Bonferroni correction: divide alpha by the number of interim looks. Two interim checks means each check uses alpha/3 instead of alpha.
3. Share the commitment with anyone who will see the results. This prevents the most common analysis error: 'it looked significant on Tuesday, so we stopped.'

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
