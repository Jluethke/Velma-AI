# Security Test Type Identifier

Identify which security test types are needed based on the application type and risk profile.

## Inputs

- `application-profile`: Application type, languages, frameworks, and deployment model
- `risk-profile`: Risk assessment or threat model for the application

## Outputs

- `required-test-types`: List of security test types needed (SAST, DAST, SCA, secrets scanning, container scanning)
- `test-priorities`: Priority order for implementing each test type

## Process

1. Map the application profile to applicable test types.
2. Prioritize based on risk: which vulnerability classes cause the most damage if missed.
3. Document the rationale for each included and excluded test type.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
