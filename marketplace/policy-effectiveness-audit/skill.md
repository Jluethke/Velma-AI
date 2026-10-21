# Policy Effectiveness Audit

Assess how well the current password policy prevents weak passwords.

## Inputs

- `pattern-report`: Password pattern analysis
- `risk-distribution`: Strength distribution

## Outputs

- `policy-gaps`: Specific policy weaknesses that allow bad passwords
- `compliance-rate`: What percentage of passwords meet each policy criterion

## Process

1. Compare cracked passwords against the stated password policy
2. Identify which policy rules are too weak to prevent common patterns
3. Calculate compliance rates for length, complexity, and rotation requirements

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
