# Logmon Retention Compliance

Verify that log retention periods meet regulatory and compliance requirements.

## Inputs

- `source-inventory`: Log source inventory
- `infrastructure-map`: Compliance frameworks applicable to the organization

## Outputs

- `retention-findings`: Log sources not meeting retention requirements
- `compliance-mapping`: Mapping of log types to applicable retention requirements

## Process

1. Identify applicable retention requirements (PCI DSS: 1 year, SOX: 7 years, HIPAA: 6 years, GDPR: varies)
2. Check actual retention settings for each log source and storage tier
3. Verify that archived logs are retrievable within required timeframes
4. Check for conflicts between retention requirements and data minimization obligations

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
