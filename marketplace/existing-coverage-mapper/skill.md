# Existing Coverage Mapper

Map every existing insurance policy to the risks it covers, including deductibles, limits, and exclusions.

## Inputs

- `insurable-risk-list`: The inventory of insurable risks
- `financial-profile`: Income and asset information for context

## Outputs

- `coverage-map`: For each risk: the policy that covers it (if any), the deductible, the coverage limit, and any exclusions
- `policy-inventory`: Every active insurance policy with its type, carrier, premium, deductible, limit, and renewal date

## Process

1. Gather all insurance policies (homeowners/renters, auto, health, disability, life, umbrella/excess, professional liability, general liability, property, cyber, workers comp, key person).
2. For each policy, extract: what risks it covers, the deductible, the per-occurrence limit, the aggregate limit, and the exclusions.
3. Map each insurable risk to its covering policy. A risk may be covered by multiple policies (overlap) or no policy (gap).
4. Note any sublimits (a policy covers the risk but with a limit far below the maximum plausible loss).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
