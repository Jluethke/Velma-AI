# Elder Care Cost Analysis

Analyze total cost of assisted living including base rate, care tiers, and hidden fees, compared to alternatives.

## Inputs

- `facility_shortlist`: Facilities being considered
- `current_income`: Resident's income sources
- `assets`: Available assets and savings
- `insurance_coverage`: Long-term care insurance if any

## Outputs

- `cost_comparison`: Total monthly cost per facility
- `funding_plan`: How to pay: income, savings, insurance, benefits
- `runway_estimate`: How long funds last at each option

## Process

1. Get full cost breakdown from each facility
2. Identify hidden fees and escalation rates
3. Map all income sources and benefits
4. Calculate financial runway per option
5. Compare to in-home care costs

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
