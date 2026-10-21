# Existing Mitigation Mapper

Map existing security controls to each threat and identify coverage gaps.

## Inputs

- `ranked-threat-list`: Threats ordered by risk score
- `architecture-diagram`: Component and data flow diagram

## Outputs

- `mitigation-coverage-map`: Each threat paired with its existing mitigations
- `gap-list`: Threats with no mitigation or insufficient coverage

## Process

1. Inventory existing security controls (firewalls, WAF, authentication, encryption, monitoring)
2. Map each control to the threats it addresses
3. Assess whether each control sufficiently reduces the risk
4. Flag threats with no mitigation or partial mitigation as gaps

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
