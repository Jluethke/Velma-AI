# Email Test Hypothesis Writer

Write the test hypothesis and define what to test.

## Inputs

- `campaign-context`: The email campaign or sequence being optimized
- `current-metrics`: Current performance metrics (open rate, click rate, conversion rate)

## Outputs

- `test-hypothesis`: The hypothesis: what change, what metric, what expected outcome
- `test-variables`: The specific variables to test (subject line, send time, CTA text, layout, personalization)

## Process

1. Identify the metric to improve (open rate = test subject/send time; click rate = test CTA/layout; conversion = test offer/landing page).
2. Write the hypothesis: 'Changing [variable] from [A] to [B] will increase [metric] by [X]% because [reason].'
3. Define the control (A) and variant (B). Change only one variable per test.
4. Set the success threshold (minimum lift to declare a winner).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
