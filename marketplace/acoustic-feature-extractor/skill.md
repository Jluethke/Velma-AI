# Acoustic Feature Extractor

Extract quantitative acoustic features from each detected event for downstream analysis.

## Inputs

- `detected-events`: Detected sound events with time and frequency bounds
- `validated-recordings`: Original audio for feature extraction

## Outputs

- `acoustic-features`: Feature table with frequency, duration, bandwidth, modulation rate, and SNR per event
- `feature-distributions`: Summary statistics and histograms for each feature

## Process

1. Extract each event's audio segment.
2. Measure peak frequency, bandwidth, duration, inter-onset interval, and frequency modulation rate.
3. Compute signal-to-noise ratio relative to the surrounding background.
4. Compile all features into a structured table indexed by event ID.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
