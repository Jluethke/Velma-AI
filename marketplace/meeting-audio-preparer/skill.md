# Meeting Audio Preparer

Prepare the meeting audio for transcription.

## Inputs

- `meeting-recording`: Audio or video file of the meeting
- `participant-list`: List of meeting participants for speaker identification

## Outputs

- `prepared-audio`: Audio file preprocessed for transcription (noise reduced, normalized, correct format)
- `speaker-profiles`: Speaker profiles for diarization (name, voice sample if available)

## Process

1. Extract audio from video if needed and convert to the target format.
2. Apply noise reduction and volume normalization.
3. Map participant names to speaker profiles for diarization.
4. Segment the audio if the meeting exceeds the engine's maximum duration.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
