# Ephys Cell Classifier

Classify cell types or response patterns based on electrophysiological features.

## Inputs

- `event-features`: Extracted features for each event or cell
- `detection-summary`: Firing patterns and rates

## Outputs

- `cell-classifications`: Each cell or unit assigned to a type based on features
- `classification-criteria`: Rules or clustering results used for classification

## Process

1. Cluster waveforms by principal component analysis of feature vectors
2. Assign clusters to known cell types based on published criteria
3. For intracellular recordings, classify by firing pattern (regular spiking, fast spiking, bursting)
4. Document the classification criteria and any ambiguous cases

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
