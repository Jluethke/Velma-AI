# Prompt Guardrail Designer

Add output formatting, validation rules, and safety guardrails.

## Inputs

- `revised-prompt`: Revised prompt
- `task-spec`: Original task specification

## Outputs

- `guarded-prompt`: Prompt with guardrails and formatting
- `guardrail-spec`: List of all guardrails and their purposes

## Process

1. Define output format constraints (JSON schema, markdown, etc.).
2. Add safety guardrails for off-topic or harmful outputs.
3. Add validation rules for expected output structure.
4. Test that guardrails do not block valid outputs.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
