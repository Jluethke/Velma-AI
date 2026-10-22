# Voice Test Case Designer

Design the test cases for the voice bot covering happy paths, edge cases, and adversarial inputs.

## Inputs

- `bot-spec`: The voice bot specification (intents, slots, dialog flows)
- `known-issues`: Any known issues or failure modes from previous testing or production

## Outputs

- `test-cases`: Complete test case set: happy path, edge cases, adversarial inputs, multi-turn conversations
- `test-priorities`: Test cases ranked by risk and coverage

## Process

1. Write happy path test cases for each intent (standard input, clean audio, cooperative caller).
2. Write edge case test cases (accents, background noise, interruptions, long pauses, one-word answers).
3. Write adversarial test cases (out-of-scope requests, prompt injection attempts, profanity, social engineering).
4. Write multi-turn test cases covering context retention across turns.
5. Rank the test cases by risk (what breaks if this fails) and coverage.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
