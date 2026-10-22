# Voice Test Data Generator

Generate or collect the test audio data for each test case.

## Inputs

- `test-cases`: The test case set
- `test-priorities`: Test priority ranking

## Outputs

- `test-audio-set`: Audio files or text-to-speech inputs for each test case
- `expected-results`: Expected bot response for each test case (intent, slots, response text)

## Process

1. For each test case, determine the input method (recorded audio, text-to-speech, live testing).
2. Generate or record the test inputs with appropriate audio quality and speaker variation.
3. Document the expected result for each test case (correct intent, correct slots, correct response).
4. Organize the test data by priority tier.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
