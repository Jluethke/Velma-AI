# Cvss Severity Classification

Classify each finding by severity using CVSS scoring with environmental and temporal modifiers.

## Inputs

- `compiled-findings`: Findings to score
- `engagement-scope`: Environmental context for CVSS scoring

## Outputs

- `scored-findings`: Findings with CVSS base, temporal, and environmental scores
- `severity-distribution`: Distribution of findings by severity level

## Process

1. Calculate CVSS base score for each finding (attack vector, complexity, privileges, impact)
2. Apply temporal modifiers (exploit maturity, remediation level, report confidence)
3. Apply environmental modifiers based on the target's business context
4. Classify as critical, high, medium, low, or informational

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
