# Acoustic Event Detector

Detect acoustic events of interest (animal calls, machinery, environmental sounds) in the spectrograms.

## Inputs

- `spectrograms`: Time-frequency representations
- `target-species-templates`: Reference spectrograms or model weights for target sounds

## Outputs

- `detected-events`: List of detections with start time, end time, frequency range, and confidence score
- `detection-summary`: Total detections per class per recording

## Process

1. Run the detector (template matching, energy threshold, or trained classifier) across all spectrograms.
2. Apply confidence threshold to retain high-quality detections.
3. Merge overlapping detections of the same class.
4. Manual-review a random subset to estimate precision and recall.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
