# Transcription Engine Selector

Select and configure the transcription engine based on accuracy, language, and cost requirements.

## Inputs

- `ingestion-config`: Audio ingestion configuration
- `quality-requirements`: Accuracy and latency needs

## Outputs

- `engine-selection`: Selected transcription engine with configuration parameters
- `accuracy-baseline`: Baseline word error rate on sample audio

## Process

1. List the candidate transcription engines (cloud APIs, on-premise models, open-source options).
2. Test each candidate on a sample of representative audio and measure the word error rate.
3. Compare on accuracy, latency, cost per hour of audio, language support, and data privacy.
4. Select the engine and configure the parameters (language model, vocabulary hints, punctuation, profanity filter).
5. Document the selection rationale and baseline accuracy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
