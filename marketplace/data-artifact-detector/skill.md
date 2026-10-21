# Data Artifact Detector

Check whether the anomaly was introduced during data processing: resampling, interpolation, filtering, normalization, or unit conversion errors.

## Inputs

- `anomaly-profile`: Quantitative characterization of the anomaly
- `processing-pipeline-description`: Steps used to process the raw data

## Outputs

- `processing-verdict`: Whether a processing step introduced the anomaly
- `processing-evidence`: Which step and what kind of artifact, if any

## Process

1. Reprocess the raw data with the anomaly window isolated.
2. Toggle each processing step off one at a time and check whether the anomaly persists.
3. Check for known artifacts of each method (Gibbs ringing from filtering, edge effects from windowing).
4. Issue a verdict: processing artifact ruled out, plausible, or confirmed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
