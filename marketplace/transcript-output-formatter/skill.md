# Transcript Output Formatter

Format the transcription output for the target use case.

## Inputs

- `diarization-config`: Speaker diarization configuration
- `accuracy-baseline`: Transcription accuracy metrics

## Outputs

- `output-format-spec`: Output format specification (JSON, SRT, plain text, structured document)
- `stt-pipeline-document`: Complete speech-to-text pipeline document covering ingestion, transcription, diarization, and output

## Process

1. Define the output format based on the use case (JSON for API consumption, SRT for subtitles, structured text for meeting notes).
2. Configure the timestamp granularity (word-level, sentence-level, speaker-turn-level).
3. Add post-processing: capitalization, punctuation, number formatting, entity recognition.
4. Configure the confidence scoring and low-confidence flagging.
5. Compile the full pipeline document.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
