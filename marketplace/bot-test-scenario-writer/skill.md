# Bot Test Scenario Writer

Define the test scenarios for a voice or chat bot.

## Inputs

- `bot-design-doc`: The bot's design document with intents, flows, and prompts
- `known-issues`: Any known issues or edge cases from prior testing

## Outputs

- `test-scenarios`: Test scenarios covering happy path, edge cases, and failure modes for each intent
- `test-utterances`: Test utterances for each scenario with expected intent and entity matches

## Process

1. Write happy path scenarios for every intent.
2. Write edge case scenarios: typos, slang, multi-intent utterances, out-of-scope requests.
3. Write failure mode scenarios: system errors, timeout, repeated misrecognition.
4. Compile 10 to 20 test utterances per intent covering phrasing variation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
