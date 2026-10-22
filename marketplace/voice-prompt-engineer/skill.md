# Voice Prompt Engineer

Write the actual prompts, responses, and error messages for each dialog state.

## Inputs

- `dialog-flows`: The conversation flow maps
- `intent-catalog`: All intents and example utterances

## Outputs

- `prompt-library`: All prompts, responses, confirmations, and error messages indexed by dialog state
- `variation-set`: Multiple phrasing variations for each prompt to avoid repetition

## Process

1. Write the greeting and main menu prompts.
2. Write the slot-filling prompts for each intent (asking for each piece of information).
3. Write the confirmation prompts (repeating back what was understood).
4. Write the error and fallback prompts (did not understand, too many retries, system error).
5. Create 2 to 3 phrasing variations for each prompt to prevent the agent from sounding scripted.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
