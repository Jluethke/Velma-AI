# Regulatory Standards Mapper

Determine which regulations and security standards apply to the system based on data types, geography, and industry.

## Inputs

- `data-classification`: Each data type classified by sensitivity level
- `system-description`: Description of the system including deployment geography and industry

## Outputs

- `applicable-regulations`: List of regulations (GDPR, HIPAA, PCI DSS, etc.) that apply
- `standards-requirements`: Security requirements derived from each applicable standard

## Process

1. Map data types and geographies to applicable regulations.
2. Extract the security-relevant requirements from each regulation.
3. Identify any industry-specific standards (SOC2, ISO 27001, NIST CSF) that apply.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
