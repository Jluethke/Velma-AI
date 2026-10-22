# Rfp Analyzer

Analyze the RFP requirements and evaluation criteria.

## Inputs

- `rfp-document`: The RFP or proposal request
- `company-capabilities`: What the company offers

## Outputs

- `requirements-matrix`: Each requirement mapped to a capability
- `gap-analysis`: Requirements that cannot be fully met

## Process

1. Extract every requirement from the RFP.
2. Map each requirement to a company capability.
3. Identify gaps where the requirement is not fully addressed.
4. Note the evaluation criteria and scoring weights.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
