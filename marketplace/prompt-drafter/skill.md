# Prompt Drafter

Write the initial prompt with few-shot examples and formatting instructions.

## Inputs

- `task-spec`: Formalized task specification
- `evaluation-rubric`: Scoring rubric

## Outputs

- `draft-prompt`: Initial prompt text with examples
- `prompt-rationale`: Why each section was included

## Process

1. Write the system prompt with role and constraints.
2. Add few-shot examples that cover common cases.
3. Specify the output format and guardrails.
4. Document the rationale for each prompt section.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
