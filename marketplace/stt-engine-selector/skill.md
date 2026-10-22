# Stt Engine Selector

Select the speech-to-text engine based on language, accuracy, and latency requirements.

## Inputs

- `stt-requirements`: Requirements: languages, accuracy target, latency budget, volume, cost constraints
- `audio-characteristics`: Source audio properties: sample rate, codec, noise level, speaker count

## Outputs

- `engine-selection`: Selected STT engine with rationale (e.g., Whisper, Google STT, Azure, Deepgram)
- `engine-config`: Configuration parameters for the selected engine

## Process

1. List candidate engines and compare on language support, accuracy benchmarks, and pricing.
2. Test each candidate against a sample of the target audio.
3. Select the engine that meets the accuracy target within the latency and cost budget.
4. Document the configuration parameters (model size, language code, punctuation settings).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
