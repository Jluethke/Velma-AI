# Sysid Data Preprocessing

Clean and condition the raw measurement data to remove artifacts, drift, and offset before model estimation.

## Inputs

- `raw-measurement-data`: Time-series of input and output channels from the identification experiment
- `excitation-signal-spec`: Expected signal properties for sanity checking the recorded data

## Outputs

- `preprocessed-data`: Cleaned, detrended, filtered, and resampled data ready for model estimation
- `data-quality-report`: Signal-to-noise ratio estimate, detected anomalies, frequency content verification, and linearity check results

## Process

1. Inspect raw data visually: time-domain plots for saturation, dropouts, and drift; frequency-domain plots for expected bandwidth coverage and noise floor.
2. Remove mean or linear trend from both input and output. For slowly drifting systems, use high-pass filtering with cutoff well below the frequency range of interest.
3. Check for and remove outliers (sensor glitches, communication dropouts). Interpolate short gaps; discard runs with long gaps.
4. If the sampling rate is much higher than needed, decimate with proper anti-aliasing (lowpass filter then downsample). Target 10x to 20x the bandwidth of interest.
5. Estimate SNR from the coherence function between input and output. Coherence near 1.0 in the frequency range of interest indicates good SNR and linearity. Low coherence indicates noise, nonlinearity, or unmeasured disturbances.
6. For nonlinearity check: compare frequency response at two different amplitudes. If gain or phase changes significantly, the linear model will be approximate and you must document the valid operating range.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
