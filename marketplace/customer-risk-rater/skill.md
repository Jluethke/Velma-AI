# Customer Risk Rater

Assess the customer risk rating based on identity, geography, and transaction profile.

## Inputs

- `verification-result`: Identity verification outcome
- `screening-hits`: Sanctions and PEP screening results

## Outputs

- `risk-rating`: Customer risk rating (low, medium, high)
- `risk-factors`: Factors contributing to the risk rating

## Process

1. Evaluate geographic risk based on country of residence and nationality.
2. Assess the customer type and expected transaction profile.
3. Weigh screening hits and adverse media findings.
4. Assign the composite risk rating.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
