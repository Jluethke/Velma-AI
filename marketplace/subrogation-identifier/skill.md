# Subrogation Identifier

Identify claims with subrogation recovery potential.

## Inputs

- `closed-claims-data`: Data on recently closed or settled claims
- `subrogation-criteria`: Criteria for identifying subrogation potential (third-party liability, product defect, negligence)

## Outputs

- `subrogation-candidates`: Claims identified as having subrogation recovery potential with the liable third party
- `recovery-estimates`: Estimated recovery amounts for each candidate

## Process

1. Screen closed claims against subrogation criteria.
2. Identify the liable third party for each candidate.
3. Estimate the potential recovery amount based on the paid claim and liability share.
4. Prioritize candidates by recovery amount and likelihood of success.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
