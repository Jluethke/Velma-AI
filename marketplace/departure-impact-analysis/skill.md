# Departure Impact Analysis

For each concentrated customer, model the impact of their departure on revenue, cash flow, and operations.

## Inputs

- `concentration-table`: Revenue by customer with shares
- `concentration-metrics`: Key concentration metrics

## Outputs

- `departure-scenarios`: For each concentrated customer: the revenue loss, the fixed costs that cannot be reduced to match, the cash flow gap, and the time to recover
- `survival-assessment`: Whether the business could survive the departure of its largest customer without emergency measures

## Process

1. For each customer above 15%, model: if they left tomorrow, what is the immediate revenue impact? Which fixed costs cannot be reduced quickly (leases, salaries, committed contracts)?
2. Calculate the cash flow gap: lost revenue minus reducible costs. This is the monthly burn you would face until replacement revenue is found.
3. Estimate time to replace: how long would it take to replace this revenue? If the customer is 30% of revenue, replacement might take 12-18 months.
4. Assess survival: do you have enough cash reserves to cover the gap for the replacement period? If not, the concentration risk is existential.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
