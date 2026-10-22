# Voice Prompt Template Writer

Write the voice prompts and response templates for each dialog turn.

## Inputs

- `conversation-flows`: Dialog flow diagrams
- `intent-entity-schema`: Intent and entity catalog

## Outputs

- `prompt-templates`: Written prompts for every dialog turn, including confirmations and clarifications
- `response-library`: Library of response variants to avoid repetition

## Process

1. Write the initial greeting and identity verification prompts.
2. Write the prompts for each dialog turn, keeping them short and natural.
3. Create response variants (at least 3 per prompt) to avoid sounding robotic.
4. Write the closing and post-interaction summary prompts.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
