# Certificate Revocation Planner

Define the revocation procedure for compromised or mis-issued certificates.

## Inputs

- `certificate-inventory`: All certificates and their issuers
- `automation-configuration`: How each certificate is renewed

## Outputs

- `revocation-procedures`: Step-by-step revocation procedures for each CA and certificate type
- `emergency-contacts`: CA contacts and escalation paths for emergency revocation

## Process

1. Document the revocation process for each CA (public CA, internal CA, cloud managed)
2. Define the criteria for when revocation is required versus re-issuance
3. List emergency contacts and response time SLAs for each CA
4. Create a runbook for certificate compromise response

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
