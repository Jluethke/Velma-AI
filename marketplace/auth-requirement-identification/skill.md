# Auth Requirement Identification

Identify the services requiring prior authorization and the payer's submission requirements.

## Inputs

- `planned-services`: List of planned services or procedures with CPT codes
- `patient-insurance`: Patient's insurance plan and payer information

## Outputs

- `auth-requirements`: Which services need authorization, the payer's submission method, and required documentation
- `timeline`: Expected turnaround time and any urgency options

## Process

1. Cross-reference the planned CPT codes against the payer's authorization list.
2. Identify the payer's submission method (portal, fax, phone).
3. List the required clinical documentation for each service.
4. Note the standard and expedited turnaround times.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
