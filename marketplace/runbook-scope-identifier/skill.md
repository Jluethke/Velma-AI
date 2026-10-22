# Runbook Scope Identifier

Identify the operational procedures that need runbooks based on alert types, common incidents, and maintenance tasks.

## Inputs

- `incident-history`: Past incidents and their resolution steps
- `alert-catalog`: List of alert types and their current documentation

## Outputs

- `runbook-inventory`: List of runbooks to write, prioritized by frequency
- `template-structure`: Standard template for runbook format

## Process

1. Review incident history for the most common resolution procedures
2. List all alert types and check which lack runbooks
3. Prioritize by incident frequency and impact
4. Define the standard runbook template structure

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
