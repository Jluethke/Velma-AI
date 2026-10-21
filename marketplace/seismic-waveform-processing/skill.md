# Seismic Waveform Processing

Process raw seismic waveforms: instrument response removal, filtering, and quality control to produce analysis-ready traces.

## Inputs

- `network-design`: Station metadata (coordinates, sensor response, orientation)
- `raw-waveforms`: Continuous or triggered waveform data in miniSEED or equivalent

## Outputs

- `processed-traces`: Instrument-corrected, filtered, QC-passed waveforms in standard format
- `data-quality-log`: Gaps, noise anomalies, and timing issues flagged per station-day

## Process

1. Remove instrument response to convert counts to ground velocity or acceleration
2. Apply bandpass filter appropriate for the target magnitude range
3. Flag and log data gaps, timing jumps, and noise anomalies
4. Output analysis-ready traces with updated metadata headers

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
