# Ephys Feature Extractor

Extract quantitative features from detected neural events.

## Inputs

- `detected-events`: Event timestamps and waveform snippets

## Outputs

- `event-features`: Amplitude, half-width, rise time, decay time, and area for each event
- `feature-summary`: Descriptive statistics of features across all events

## Process

1. Measure peak amplitude and trough amplitude for each event
2. Compute half-width, 10-90% rise time, and decay time constant
3. Calculate the area under the curve for each event
4. Summarize features with mean, median, standard deviation, and distributions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
