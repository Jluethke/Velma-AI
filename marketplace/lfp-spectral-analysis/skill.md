# Lfp Spectral Analysis

Extract and analyze local field potential features including power spectra, event-related potentials, and time-frequency decompositions for neural state characterization.

## Inputs

- `cleaned-neural-data`: Artifact-cleaned broadband neural recording

## Outputs

- `lfp-features`: Power spectral densities by frequency band (delta, theta, alpha, beta, gamma, high-gamma), event-related potentials, and time-frequency spectrograms
- `neural-state-markers`: Identified neural states (e.g., sleep stages from delta/spindle power, attention from alpha desynchronization, motor preparation from beta suppression)

## Process

1. Low-pass filter and downsample to 1 kSps (anti-alias filter at 400 Hz before decimation). Re-reference if needed: bipolar montage for localized signals, Laplacian for spatial filtering of ECoG/EEG. For LFP from penetrating arrays, local re-referencing between nearby contacts improves spatial specificity.
2. Compute power spectral density using Welch's method (2-second Hanning windows, 50% overlap) or multitaper method (3-5 tapers for optimal bias-variance trade-off at each frequency). Extract band power by integrating PSD: delta (0.5-4 Hz), theta (4-8 Hz), alpha (8-13 Hz), beta (13-30 Hz), low gamma (30-70 Hz), high gamma (70-200 Hz). High gamma from ECoG is a reliable proxy for local cortical activation.
3. For event-locked analysis: epoch data around events (stimulus onset, movement onset), average across trials to obtain event-related potentials (ERPs). Compute time-frequency decomposition using Morlet wavelet convolution (wave number 5-7 for good time-frequency trade-off) or short-time Fourier transform. Normalize to baseline period using decibel or z-score transform. Identify event-related spectral perturbations (ERSP): desynchronization (power decrease) or synchronization (power increase) in specific bands.
4. Derive neural state markers: beta (13-30 Hz) desynchronization over motor cortex indicates motor preparation (onset 500-1000 ms before movement). Alpha (8-13 Hz) suppression over visual cortex indicates visual attention. Theta (4-8 Hz) power in hippocampal recordings marks memory encoding. Sleep staging: high delta + sleep spindles (12-15 Hz) = N2 sleep. Document which markers are present and their reliability (effect size across trials).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
