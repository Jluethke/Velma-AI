# Data Flow Protection Assessor

Assess data flow protections including encryption in transit and at rest, and data integrity controls.

## Inputs

- `trust-boundary-map`: Trust boundary map
- `authn-assessment`: Authentication assessment findings

## Outputs

- `encryption-assessment`: Assessment of encryption coverage for data in transit and at rest
- `integrity-assessment`: Assessment of data integrity controls across flows

## Process

1. Map every data flow path and classify by sensitivity
2. Verify encryption protocols and cipher suites for data in transit
3. Check encryption at rest for each storage system
4. Assess integrity controls (signatures, checksums, HMAC) on critical data paths

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
