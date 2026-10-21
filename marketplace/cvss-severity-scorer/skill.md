# Cvss Severity Scorer

Score the confirmed vulnerability using CVSS and classify its severity.

## Inputs

- `reproduction-result`: Confirmed vulnerability with proof
- `affected-versions`: All affected versions

## Outputs

- `cvss-score`: CVSS base, temporal, and environmental scores
- `severity-classification`: Critical, High, Medium, or Low classification

## Process

1. Score the CVSS base metrics (attack vector, complexity, privileges required, user interaction, scope, CIA impact)
2. Score temporal metrics (exploit maturity, remediation level, report confidence)
3. Classify severity based on the overall score
4. Compare with similar past vulnerabilities for consistency

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
