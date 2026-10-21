# Child Support Estimator

Estimate child support obligations based on income, custody split, and state guidelines.

## Inputs

- `parent_incomes`: Both parents' gross incomes
- `custody_split`: Percentage of overnights per parent
- `state_of_residence`: State for guideline reference
- `childcare_costs`: Daycare or childcare expenses

## Outputs

- `support_estimate`: Estimated monthly child support
- `deviation_factors`: Factors that could change the amount
- `modification_triggers`: When support can be modified

## Process

1. Apply state child support formula
2. Factor in custody time split
3. Include childcare and insurance costs
4. Note factors that allow deviation
5. Identify triggers for future modification

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
