# Churned Vs Retained Behavior Comparer

Compare the behavior of people who churned vs. people who stayed. The differences reveal the predictive signals.

## Inputs

- `user-activity-data`: Activity data for churned and retained users over the 90 days before churn
- `churn-definition`: How churn is defined (cancelled subscription, no login in 30 days, no purchase in 90 days)

## Outputs

- `behavioral-differences`: The behaviors that are statistically different between churners and retainers: login frequency, feature usage, support tickets, engagement patterns
- `candidate-churn-signals`: The 3-5 behaviors most predictive of future churn, ranked by signal strength

## Process

1. Pull activity data for two groups: people who churned in the last 6 months and a matched sample of people who did not churn during the same period.
2. Compare their behavior in the 90 days before the churn event (or the equivalent period for the retained group): login frequency, feature usage breadth, engagement depth, support ticket volume, billing issues, response to communications.
3. Find the statistically significant differences: which behaviors are different enough that the difference is unlikely to be random?
4. Rank the differences by signal strength: which behavior change most reliably precedes churn?

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
