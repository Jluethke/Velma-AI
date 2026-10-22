# Conversation Flow Writer

Write conversation flows for each chatbot intent.

## Inputs

- `intent-catalog`: Intents to support
- `intent-examples`: Example utterances per intent

## Outputs

- `conversation-flows`: Scripted flows for each intent
- `fallback-paths`: Fallback and human-handoff paths

## Process

1. For each intent, write the conversation tree (greeting, clarification, resolution, confirmation).
2. Design fallback responses for unrecognized inputs.
3. Define handoff criteria to a human agent.
4. Include entity extraction points (order number, account, product).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
