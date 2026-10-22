# Conversion Requirements Gatherer

Define the input and output formats, volume, and quality requirements for the conversion pipeline.

## Inputs

- `source-formats`: List of input file formats (e.g., PDF, DOCX, PNG, MP4, WAV)
- `target-formats`: Desired output formats for each input type

## Outputs

- `conversion-matrix`: Source-to-target format mapping with quality and size requirements
- `volume-estimate`: Expected file count and total size per conversion type

## Process

1. List every source-to-target format pair needed.
2. For each pair, note the quality requirements (resolution, bitrate, compression level, OCR accuracy).
3. Estimate the volume: how many files per day, week, or batch, and the average file size.
4. Identify any special handling: password-protected files, multi-page documents, or embedded media.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
