# Pareto Recheck Schedule

Schedule the recheck. Pareto distributions shift over time. Last year's vital few may be this year's trivial many. Set a recurring recheck to re-run the analysis and adjust the reallocation.

## Inputs

- `reallocation-plan`: The current resource allocation plan
- `domain-description`: The area being analyzed, for scheduling context

## Outputs

- `recheck-schedule`: When to re-run the Pareto analysis (quarterly for business, monthly for personal, annually for portfolio)
- `pareto-analysis-report`: The complete analysis: input list, Pareto curve, vital few, trivial many, reallocation plan, and recheck schedule

## Process

1. Set the recheck frequency based on how fast the domain changes. Fast-changing domains (marketing channels, product features) recheck quarterly. Stable domains (customer portfolio, personal habits) recheck semi-annually.
2. At each recheck, re-run the entire analysis from scratch. Do not assume last period's vital few are still vital. Check whether the reallocation produced the expected output gain.
3. If the Pareto ratio has become less extreme (closer to 50/50), the reallocation is working: you reduced the concentration by improving the former trivial many or by realizing the former vital few had a ceiling.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
