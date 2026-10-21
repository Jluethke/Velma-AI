# Vendor Contract Requirements Builder

Translate the risk rating and findings into contract security requirements and conditions the vendor must meet before or during the engagement.

## Inputs

- `risk-rating`: Overall vendor risk tier with per-finding severity.
- `finding-list`: The specific control shortfalls to address.

## Outputs

- `contract-security-requirements`: Clauses and obligations to add to the agreement, such as audit rights, breach notice, and control commitments.
- `remediation-conditions`: Findings the vendor must fix with target dates and the proof required to close each one.

## Process

1. Map each high-severity finding to a contract clause or an obligation.
2. Set audit rights, breach notice terms, and control commitments sized to the risk tier.
3. Define remediation conditions with target dates and the proof needed to close them.
4. Mark which conditions must be met before signing and which may run during the term.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
