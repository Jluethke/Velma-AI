# Pay Equity Assessor

Assess pay equity across demographic groups controlling for legitimate factors.

## Inputs

- `demographic-dataset`: Demographic data with compensation
- `reporting-period`: Time period

## Outputs

- `pay-equity-results`: Pay gap analysis controlling for role, level, tenure, and location
- `equity-adjustments`: Recommended adjustments to close identified gaps

## Process

1. Run a regression analysis controlling for role, level, tenure, location, and performance
2. Identify unexplained pay gaps by demographic group
3. Calculate the cost of closing identified gaps
4. Recommend adjustments with a prioritized timeline

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
