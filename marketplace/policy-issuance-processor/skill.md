# Policy Issuance Processor

Issue a new insurance policy in the administration system.

## Inputs

- `bound-policy-details`: The bound policy details from underwriting (insured, coverage, premium, effective date)
- `policy-forms`: The policy form set and endorsements for this coverage

## Outputs

- `issued-policy`: The issued policy with policy number, declarations page, and full form set
- `billing-setup`: The billing plan and first invoice for the policy

## Process

1. Enter the policy data into the administration system.
2. Generate the declarations page and assemble the policy form set.
3. Set up the billing plan (direct bill, agency bill, installments).
4. Deliver the policy documents to the insured and agent.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
