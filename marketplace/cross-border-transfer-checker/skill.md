# Cross Border Transfer Checker

Check that cross-border data transfers have valid legal mechanisms in place.

## Inputs

- `processing-register`: Activities involving international transfers
- `basis-audit-results`: Lawful basis context for transfers

## Outputs

- `transfer-assessment`: Assessment of each transfer mechanism
- `transfer-gaps`: Transfers lacking valid mechanisms

## Process

1. Identify all data flows crossing the EEA boundary
2. Check for adequacy decisions, SCCs, BCRs, or derogations for each
3. Verify that transfer impact assessments are current
4. Flag transfers with no valid mechanism

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
