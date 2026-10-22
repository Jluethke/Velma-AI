# Tts Parameter Configurer

Configure the speech parameters and SSML markup for pauses, emphasis, and prosody.

## Inputs

- `tts-engine-selection`: Selected TTS engine and voice
- `voice-samples`: Sample audio from the selected voice

## Outputs

- `speech-parameters`: Configured rate, pitch, and volume settings
- `ssml-templates`: SSML templates for common patterns (pauses, emphasis, lists, numbers, dates)

## Process

1. Set the speaking rate, pitch, and volume for the target use case.
2. Write SSML templates for pauses between sentences and list items.
3. Write SSML templates for emphasis on key words and proper noun pronunciation.
4. Write SSML templates for reading numbers, dates, currency, and phone numbers correctly.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
