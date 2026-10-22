# Tts Engine Voice Selector

Select the TTS engine and voice based on language, style, and naturalness requirements.

## Inputs

- `tts-requirements`: Requirements: languages, voice style (warm, professional, casual), use case (IVR, narration, assistant)
- `brand-voice-guidelines`: Brand voice and tone guidelines if available

## Outputs

- `tts-engine-selection`: Selected TTS engine and voice with rationale
- `voice-samples`: Sample audio from the selected voice for stakeholder review

## Process

1. List candidate TTS engines and their available voices.
2. Filter by language support and voice style match.
3. Generate sample audio for each finalist voice using representative phrases.
4. Select the voice that best matches the brand tone and naturalness requirements.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
