# Ephys Trace Importer

Import raw electrophysiology traces and associated metadata.

## Inputs

- `recording-files`: Raw recording files (ABF, NWB, EDF, or proprietary format)
- `recording-metadata`: Electrode configuration, sampling rate, and recording conditions

## Outputs

- `raw-traces`: Time-voltage traces for each channel
- `recording-catalog`: Summary of channels, durations, and protocols per file

## Process

1. Read the recording file format and extract voltage traces per channel
2. Parse protocol information (stimulus type, amplitude, duration, inter-sweep interval)
3. Verify sampling rate and channel assignments match the expected configuration
4. Catalog all recordings with their protocols and conditions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
