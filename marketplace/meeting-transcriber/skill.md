# Meeting Transcriber

Transcribe the meeting audio with speaker identification.

## Inputs

- `prepared-audio`: Preprocessed audio file
- `speaker-profiles`: Speaker profiles for diarization

## Outputs

- `raw-transcript`: Timestamped transcript with speaker labels
- `transcription-confidence`: Confidence scores and flagged low-confidence segments

## Process

1. Run the transcription engine with speaker diarization enabled.
2. Label each segment with the identified speaker.
3. Flag segments with low confidence for manual review.
4. Merge segments from the same speaker that were split by short pauses.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
