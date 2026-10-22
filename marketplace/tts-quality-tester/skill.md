# Tts Quality Tester

Test TTS output quality and set up the production endpoint.

## Inputs

- `speech-parameters`: Configured speech parameters
- `ssml-templates`: SSML templates

## Outputs

- `tts-test-results`: Quality test results across target phrases, including naturalness ratings and pronunciation errors
- `tts-setup-document`: Complete TTS setup document with engine, voice, parameters, SSML templates, and test results

## Process

1. Generate audio for a test set covering all SSML patterns and edge cases.
2. Review each sample for naturalness, pronunciation accuracy, and pacing.
3. Fix any pronunciation errors using phoneme overrides or lexicon entries.
4. Document the production endpoint configuration and compile the setup document.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
