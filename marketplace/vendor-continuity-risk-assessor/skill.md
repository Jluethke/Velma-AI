# Vendor Continuity Risk Assessor

Assess business continuity risk from vendor dependency and potential failure.

## Inputs

- `integration-inventory`: Vendor integration inventory
- `vendor-list`: Vendor list with financial and operational details

## Outputs

- `continuity-risk-assessment`: Business impact of each vendor failing or being compromised
- `contingency-plan-status`: Whether contingency plans exist for critical vendor dependencies

## Process

1. Classify each vendor by criticality to business operations
2. Assess the business impact if each critical vendor becomes unavailable
3. Check for concentration risk (multiple dependencies on one vendor)
4. Verify that contingency plans and data portability options exist for critical vendors

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
