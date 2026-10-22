# Rag Generation Prompt Designer

Design the generation prompt that uses retrieved context.

## Inputs

- `retrieval-pipeline`: Retrieval pipeline
- `use-case`: Expected output format

## Outputs

- `generation-prompt`: Prompt template with context injection
- `prompt-guardrails`: Rules for hallucination prevention and citation

## Process

1. Write the system prompt with grounding instructions.
2. Design the context injection format.
3. Add citation requirements and hallucination guardrails.
4. Test with sample queries and retrieved contexts.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
