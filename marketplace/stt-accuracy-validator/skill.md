# Stt Accuracy Validator

Validate transcription accuracy against reference transcripts and produce the pipeline documentation.

## Inputs

- `post-processing-rules`: Post-processing rules
- `output-schema`: Output schema

## Outputs

- `accuracy-report`: Word error rate and accuracy metrics against reference transcripts
- `stt-pipeline-doc`: Complete pipeline documentation covering engine selection, preprocessing, post-processing, and accuracy results

## Process

1. Prepare a reference transcript set (manually verified ground truth).
2. Run the pipeline on the reference audio and compare output to ground truth.
3. Calculate word error rate (WER) and segment-level accuracy.
4. Compile the pipeline documentation with configuration, accuracy results, and known limitations.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
