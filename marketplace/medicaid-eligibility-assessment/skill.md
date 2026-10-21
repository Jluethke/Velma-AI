# Medicaid Eligibility Assessment

Assess Medicaid eligibility based on income, assets, and state rules, including dual-eligible scenarios.

## Inputs

- `monthly_income`: Total monthly income
- `assets`: Countable assets
- `state`: State of residence
- `household_size`: Number in household

## Outputs

- `medicaid_eligibility`: Likely eligible, possibly eligible, or ineligible
- `spend_down_options`: Options if over income/asset limits
- `dual_eligible_benefits`: Extra benefits if Medicare + Medicaid

## Process

1. Check income against state limits
2. Assess countable vs exempt assets
3. Identify spend-down or medically needy pathways
4. Check dual-eligible extra help programs
5. Map application process and timeline

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
