# Voice Agent Test Runner

Test the voice agent with sample conversations and measure recognition accuracy.

## Inputs

- `prompt-templates`: Written prompts
- `fallback-flows`: Fallback and error handling paths

## Outputs

- `test-results`: Results from sample conversation tests including intent accuracy and task completion rate
- `voice-agent-design-doc`: Final voice agent design document combining all flows, prompts, and test results

## Process

1. Run each use case through the happy path with sample utterances.
2. Run edge cases: ambiguous input, out-of-scope requests, silence, interruptions.
3. Measure intent recognition accuracy and task completion rate.
4. Compile the design document with flows, prompts, fallbacks, and test results.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
