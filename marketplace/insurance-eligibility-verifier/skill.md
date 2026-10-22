# Insurance Eligibility Verifier

Verify insurance eligibility and benefits.

## Inputs

- `insurance-details`: Payer, policy number, group number
- `chief-complaint`: Reason for the visit in the patient's words

## Outputs

- `eligibility-status`: Active, inactive, or pending verification
- `benefit-summary`: Copay, deductible, and coverage details

## Process

1. Submit eligibility query to the payer.
2. Confirm active coverage and effective dates.
3. Document copay, deductible, and authorization requirements.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
