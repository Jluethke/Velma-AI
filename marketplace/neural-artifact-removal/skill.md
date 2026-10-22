# Neural Artifact Removal

Remove artifacts from raw neural recordings using methods matched to each artifact source: line noise, motion, stimulation, and biological interference.

## Inputs

- `raw-neural-data`: Digitized multi-channel neural recording with metadata (sample rate, channel map, recording conditions)
- `recording-metadata`: Electrode type, reference scheme, known artifact sources (stimulation timing, movement markers)

## Outputs

- `cleaned-neural-data`: Neural recording with artifacts removed or attenuated, preserving signal features
- `artifact-removal-report`: Which methods were applied, how much variance was removed, and any channels flagged as unrecoverable

## Process

1. Apply a notch filter at 50/60 Hz (and harmonics) to remove power line interference only if line noise exceeds 5 uV peak. Use a zero-phase IIR notch (Q factor 30-50) or subtract a sinusoidal template estimated from the data. Avoid aggressive notch filters near neural frequencies of interest.
2. Remove motion and muscle artifacts using Independent Component Analysis (ICA). Run ICA on the multi-channel data (FastICA or Infomax). Identify artifact components by their spatial topography (frontal bilateral for eye blinks, lateral for saccades, high-frequency broadband for EMG) and temporal characteristics (correlation with EOG/EMG reference channels if available). Remove identified components and reconstruct. For intracortical recordings, common average referencing (CAR) removes shared motion artifacts: subtract the mean across all channels from each channel.
3. Handle stimulation artifacts (if recording during stimulation): blank the stimulation window (typically 0.5-2 ms after each pulse) and interpolate, or use template subtraction by averaging the artifact waveform across hundreds of stimulation events and subtracting the template from each occurrence. For exponential decay artifacts from charge redistribution, fit and subtract an exponential model.
4. Flag and exclude bad channels: channels with impedance greater than 2 MOhm (for microelectrodes) or sustained 60 Hz amplitude greater than 50 uV after filtering, or channels with flat signals (broken connections). Interpolate from neighbors for surface arrays (EEG, ECoG) using spherical spline interpolation. For penetrating arrays, simply exclude dead channels from downstream analysis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
