# Localization Scope Planner

Inventory the supported languages and plan the localization scope.

## Inputs

- `target-languages`: Languages and locales the bot should support
- `bot-content-inventory`: Inventory of all user-facing strings, prompts, and dialog flows

## Outputs

- `localization-plan`: Plan: languages, priority order, content to translate, cultural adaptation notes
- `string-catalog`: Extracted string catalog with keys, source text, and context notes for translators

## Process

1. List the target languages and locales, ordered by user base size.
2. Extract all user-facing strings from the bot's prompts, responses, buttons, and error messages.
3. Tag each string with context (where it appears, what it refers to) for translator reference.
4. Note cultural adaptations needed beyond translation (date formats, currency, naming conventions).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
