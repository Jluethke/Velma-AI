# Cohort Insight Extractor

Extract the actionable insight from the cohort comparison. The insight is not 'retention is 40%.' The insight is 'cohorts acquired after we changed the onboarding flow retain 12 percentage points better at month 3.' The first is a number. The second is a decision input.

## Inputs

- `cohort-comparison`: How newer cohorts compare to older ones
- `inflection-points`: Where the cohort curves changed shape

## Outputs

- `cohort-insights`: The specific, actionable findings from the cohort analysis, with magnitudes and confidence levels
- `recommended-actions`: What to do based on the findings: double down on what improved the curves, investigate what worsened them

## Process

1. For each inflection point, identify what changed between the before and after cohorts. Was there a product change, a marketing shift, a process update, a seasonal effect?
2. Quantify the difference: how many percentage points better or worse are the post-inflection cohorts at each age? Is the difference consistent or does it converge over time?
3. If the change was intentional (a new onboarding flow), attribute the improvement. If unintentional, investigate. If seasonal, note it and do not attribute it to anything you did.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
