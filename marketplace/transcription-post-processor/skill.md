# Transcription Post Processor

Apply post-processing to the raw transcription output.

## Inputs

- `preprocessing-pipeline`: Audio preprocessing pipeline
- `engine-config`: STT engine configuration

## Outputs

- `post-processing-rules`: Rules for punctuation restoration, speaker diarization, and text formatting
- `output-schema`: Schema for the final transcript output (timestamps, speaker labels, confidence scores)

## Process

1. Configure punctuation and capitalization restoration.
2. Set up speaker diarization (identify and label each speaker).
3. Define the output format: plain text, timestamped segments, or structured JSON.
4. Add domain-specific vocabulary corrections (proper nouns, technical terms).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
