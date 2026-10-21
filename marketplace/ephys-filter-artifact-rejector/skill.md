# Ephys Filter Artifact Rejector

Filter recordings and reject artifacts to isolate the signal of interest.

## Inputs

- `raw-traces`: Unfiltered time-voltage traces
- `recording-metadata`: Sampling rate and expected signal bandwidth

## Outputs

- `filtered-traces`: Bandpass-filtered traces with artifacts removed
- `artifact-log`: Timestamps and channels where artifacts were detected and removed

## Process

1. Apply a bandpass filter appropriate to the signal type (e.g., 300-3000 Hz for spikes, 1-100 Hz for LFP)
2. Detect and mark stimulus artifacts, saturation events, and movement artifacts
3. Blank or interpolate artifact regions
4. Document filter settings and artifact rejection criteria

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
