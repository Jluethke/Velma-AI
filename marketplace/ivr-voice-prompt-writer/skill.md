# Ivr Voice Prompt Writer

Write the voice prompts for each menu level and option.

## Inputs

- `menu-tree`: Complete IVR menu tree
- `shortcut-map`: DTMF shortcuts

## Outputs

- `ivr-prompts`: Written prompts for every menu, including greeting, options, and error messages
- `ivr-prompt-timing`: Estimated duration of each prompt in seconds

## Process

1. Write the welcome greeting (company name, brief instruction, language selection if needed).
2. Write each menu prompt: state the options clearly with the number first ('Press 1 for...').
3. Write the error prompts: invalid input, timeout, and maximum retries exceeded.
4. Time each prompt to keep menu levels under 30 seconds total.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
