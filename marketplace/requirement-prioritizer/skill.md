# Requirement Prioritizer

Prioritize the security requirements by risk reduction and cost so scope decisions are explicit.

## Inputs

- `security-requirements`: Testable requirements that counter the abuse cases
- `requirement-rationale`: The threat each requirement answers and why

## Outputs

- `prioritized-requirements`: Requirements ordered by risk reduction and cost
- `priority-rationale`: The basis for each priority ranking

## Process

1. Score each requirement by the risk it reduces using its rationale
2. Estimate implementation and verification cost for each requirement
3. Rank requirements by risk reduction per unit of cost
4. Document the basis so scope cuts can be defended later

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
