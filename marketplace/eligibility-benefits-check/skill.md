# Eligibility Benefits Check

Verify eligibility and benefits with the payer electronically or by phone.

## Inputs

- `insurance-profile`: Patient's insurance record
- `visit-type`: The type of visit or service planned (office visit, procedure, imaging)

## Outputs

- `eligibility-result`: Active or inactive status, effective dates, and plan type
- `benefits-detail`: Copay, coinsurance, deductible (met and remaining), out-of-pocket max, and visit limits

## Process

1. Submit the 270/271 eligibility inquiry to the payer electronically.
2. Record the coverage status (active, terminated, pending) and effective dates.
3. Extract the benefits for the planned visit type (copay, coinsurance percentage, deductible amounts).
4. Note any visit limits, referral requirements, or network restrictions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
