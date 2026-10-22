# Funnel Optimization Cycle

Test the fix hypotheses and measure the impact. Then move to the next biggest drop. Continuous improvement, one stage at a time.

## Inputs

- `fix-hypotheses`: The testable hypotheses
- `stage-conversion-rates`: The baseline conversion rates

## Outputs

- `test-results`: The results of each fix: the change in conversion rate at the target stage and the change in overall funnel throughput
- `updated-funnel-metrics`: The new conversion rates after the fix, with the next biggest drop identified for the next cycle

## Process

1. Test the top hypothesis. Use an A/B test if you have enough traffic. Use a before/after comparison if you do not.
2. Measure the impact at the target stage AND on overall funnel throughput. A fix that improves one stage but worsens the next is not a net improvement.
3. If the fix works, implement it permanently. Update the baseline conversion rates.
4. Identify the next biggest drop. Repeat the cycle. Over time, the funnel tightens and overall throughput increases.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
