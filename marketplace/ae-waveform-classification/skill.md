# Ae Waveform Classification

Classify AE events by their waveform parameters to distinguish source mechanisms.

## Inputs

- `located-events`: Filtered and located AE events with waveforms
- `monitoring-objectives`: Expected damage types for classification categories

## Outputs

- `classified-events`: Events labeled by source mechanism: matrix cracking, delamination, fiber breakage, friction, etc.
- `classification-statistics`: Event counts and energy by class over time and load level

## Process

1. Extract waveform features: peak amplitude, rise time, duration, frequency centroid, counts
2. Apply pattern recognition (k-means, supervised classification, or decision boundaries) to group events
3. Assign physical meaning to each cluster based on known waveform signatures for the material
4. Track the evolution of each class with increasing load

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
