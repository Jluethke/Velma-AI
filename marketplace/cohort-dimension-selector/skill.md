# Cohort Dimension Selector

Choose the dimension that defines your cohorts. The cohort dimension is the thing that groups people or items by when or how they entered. Signup month, acquisition channel, product tier, hire date, habit start week. The right dimension depends on the question you are trying to answer.

## Inputs

- `analysis-question`: The question you are trying to answer (e.g., 'is retention improving?', 'which channel produces the best customers?', 'am I getting better at this habit?')
- `available-data`: What data you have, including time range and segmentation fields

## Outputs

- `cohort-dimension`: The field used to group entities into cohorts (e.g., signup month, acquisition source)
- `cohort-metric`: The metric tracked for each cohort over time (e.g., retention rate, lifetime value, session completion rate)

## Process

1. Start with the question. 'Is retention improving?' means cohort by signup month, metric is retention. 'Which channel is best?' means cohort by acquisition channel, metric is lifetime value.
2. Verify you have enough data: at least 4 cohorts with at least 20 members each. Fewer than 4 cohorts cannot show a trend. Fewer than 20 members per cohort produces noisy curves.
3. If you have multiple candidate dimensions, pick the one most aligned with the decision you will make. If you are deciding where to spend marketing budget, cohort by channel. If you are evaluating a product change, cohort by signup month (before vs. after the change).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
