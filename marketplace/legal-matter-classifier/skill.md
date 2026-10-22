# Legal Matter Classifier

Classify the request by matter type and assess its urgency and complexity.

## Inputs

- `logged-request`: The logged request
- `initial-category`: Preliminary category

## Outputs

- `matter-classification`: Final classification (contract, employment, litigation, regulatory, IP, general)
- `urgency-assessment`: Urgency level (critical, high, standard, low) with rationale

## Process

1. Review the request details to confirm or correct the preliminary category.
2. Assess urgency based on deadlines, legal exposure, and business impact.
3. Assess complexity based on matter type, parties involved, and jurisdictions.
4. Produce the final classification and urgency assessment.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
