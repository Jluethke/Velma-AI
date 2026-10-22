# Enforcement Event Logger

Log each guardrail enforcement event.

## Inputs

- `guardrail-inventory`: List of all guardrails
- `guardrail-classification`: Guardrail types

## Outputs

- `enforcement-log-schema`: Schema for enforcement event records
- `logging-integration-plan`: How enforcement events get logged (automated and manual)

## Process

1. Define the enforcement event schema (timestamp, guardrail ID, trigger details, action taken, actor, outcome).
2. Identify which guardrails already emit logs and which need manual recording.
3. Design integrations for automated capture.
4. Produce the logging schema and integration plan.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
