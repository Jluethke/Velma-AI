# Neuro Data Preprocessing Pipeline

Preprocess neuroimaging data: format conversion, motion correction, spatial normalization, smoothing (fMRI) or artifact rejection and re-referencing (EEG).

## Inputs

- `acquisition-protocol`: Modality and parameters determine preprocessing steps
- `session-structure`: Which runs to process and in what order

## Outputs

- `preprocessed-dataset`: Clean, normalized data ready for statistical analysis
- `quality-report`: Motion parameters, artifact counts, excluded volumes or epochs, and signal-to-noise estimates
- `preprocessing-log`: Software versions, parameter settings, and processing order for reproducibility

## Process

1. Convert raw data to standard format (BIDS for fMRI, EDF/BrainVision for EEG)
2. Apply motion correction or artifact rejection and interpolation
3. Normalize to standard space (MNI) or re-reference and filter (EEG)
4. Apply spatial smoothing or time-frequency decomposition as appropriate
5. Generate quality reports and flag participants for exclusion

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
