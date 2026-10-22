# Guardrail Inventory Builder

Inventory all guardrails and their trigger conditions.

## Inputs

- `guardrail-sources`: Where guardrails are defined (policies, code, configs)
- `operational-scope`: What systems and processes the guardrails cover

## Outputs

- `guardrail-inventory`: Complete list of guardrails with conditions and actions
- `guardrail-classification`: Guardrails classified by type (hard block, warning, audit-only)

## Process

1. Collect all guardrails from their source documents and systems.
2. For each guardrail, record the trigger condition, the enforced action, and the severity.
3. Classify each as hard block, warning, or audit-only.
4. Produce the guardrail inventory.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
