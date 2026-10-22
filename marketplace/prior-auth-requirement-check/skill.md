# Prior Auth Requirement Check

Determine whether the planned service requires prior authorization from the payer.

## Inputs

- `benefits-detail`: Benefits information including authorization requirements
- `visit-type`: The planned service type

## Outputs

- `auth-requirement`: Whether prior authorization is required, and for which services
- `auth-instructions`: Instructions for obtaining authorization if required (phone, portal, form)

## Process

1. Check the benefits response for prior authorization requirements for the planned service.
2. Cross-reference with the payer's authorization list for the CPT code range.
3. If authorization is required, record the submission method and turnaround time.
4. Flag the visit for the prior authorization workflow if needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
