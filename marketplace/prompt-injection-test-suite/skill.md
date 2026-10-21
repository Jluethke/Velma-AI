# Prompt Injection Test Suite

Test for direct and indirect prompt injection vulnerabilities in the LLM application.

## Inputs

- `application-endpoint`: URL or interface for the LLM application
- `system-prompt-access`: System prompt text if available, or black-box testing flag

## Outputs

- `injection-findings`: Successful prompt injection vectors found
- `injection-resistance-score`: Score for prompt injection resistance

## Process

1. Test direct injection by embedding override instructions in user messages
2. Test indirect injection by placing instructions in documents the LLM processes
3. Try instruction hierarchy attacks (pretend to be a system message, claim higher authority)
4. Test for delimiter escape and context window manipulation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
