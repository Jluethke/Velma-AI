# Gap Remediator

Remediate gaps identified during evidence collection before the audit.

## Inputs

- `collection-gaps`: Controls with missing or insufficient evidence
- `control-matrix`: Full control matrix for context

## Outputs

- `remediation-log`: Record of all remediation actions taken
- `updated-evidence`: New evidence collected after remediation

## Process

1. Prioritize gaps by severity and audit timeline
2. Implement the missing control or fix the configuration
3. Collect new evidence demonstrating the control is operating
4. Log each remediation action with before and after state

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
