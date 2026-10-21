# Spectral Report Assembler

Compile the spectral analysis results into a structured report: dominant frequencies, spectral shape, filtered components, and interpretation.

## Inputs

- `peak-table`: Identified spectral peaks
- `psd-estimate`: Power spectral density estimate
- `filtered-signal`: Extracted band-limited signal

## Outputs

- `spectral-report`: Structured analysis report with figures and interpretation
- `frequency-summary`: Table of dominant frequencies and their physical interpretation

## Process

1. Summarize the dominant spectral peaks and their physical meaning.
2. Describe the overall spectral shape (broadband vs narrowband, colored noise type).
3. Present the filtered component and its time-domain behavior.
4. Note any unexpected features or artifacts found during the analysis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
