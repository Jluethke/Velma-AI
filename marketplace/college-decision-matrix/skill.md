# College Decision Matrix

Compare admission offers with financial aid packages to make a final enrollment decision.

## Inputs

- `admission_offers`: Schools admitted to
- `financial_packages`: Aid packages per school
- `priorities`: Weighted decision factors

## Outputs

- `decision_matrix`: Weighted scoring of all options
- `net_cost_comparison`: 4-year net cost per school
- `recommendation`: Top pick with rationale

## Process

1. Normalize financial packages to 4-year net cost
2. Score each school on weighted criteria
3. Compare campus visit impressions
4. Identify deal-breakers
5. Produce ranked recommendation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
