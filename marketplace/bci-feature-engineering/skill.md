# Bci Feature Engineering

Select and extract neural features that carry the most information about the intended variable, matched to the signal type and BCI application.

## Inputs

- `sorted-spike-trains`: Single-unit and multi-unit spike trains from neural recording
- `lfp-features`: LFP band power features
- `behavioral-data`: Ground truth behavioral measurements (hand position/velocity, speech audio, cursor target position) time-aligned to neural data

## Outputs

- `feature-matrix`: Neural features extracted at each time bin (channels x features x time), with feature labels and bin size
- `feature-information-analysis`: Mutual information or R-squared between each feature and the behavioral target, guiding feature selection

## Process

1. Define the time bin size from the application latency requirement. For continuous cursor control: 50-100 ms bins provide a good trade-off between temporal resolution and firing rate estimation reliability (a neuron firing at 20 Hz gives 1-2 spikes per 50 ms bin, Poisson-limited). For speech BCI: 20-50 ms bins to capture fast articulatory dynamics. For discrete selection: trial-averaged features over 200-500 ms windows.
2. Extract features by signal type. From spike trains: firing rate (spike count / bin duration), or threshold crossings per bin if spike sorting is not used (multi-unit activity, which is more stable across days). From LFP/ECoG: band power in relevant bands (high gamma 70-200 Hz from ECoG is the most informative for motor and speech decoding, extracted as the analytic amplitude of the bandpass-filtered signal). From EEG: mu rhythm (8-12 Hz) and beta (13-30 Hz) desynchronization over motor cortex.
3. Perform feature selection. Calculate the mutual information or correlation (R-squared) between each neural feature and the behavioral target at multiple time lags (neural activity leads behavior by 50-200 ms in motor cortex). Select the top N features that provide the highest decoding performance in cross-validation, using forward selection or L1 regularization. For high-dimensional feature spaces (1000+ channels x multiple features), PCA or factor analysis first reduces dimensionality to 20-100 latent factors, then decode from factors.
4. Handle non-stationarity. Neural feature distributions shift across minutes (adaptation), hours (electrode drift), and days (chronic changes). Z-score features within each session block (subtract mean, divide by standard deviation of a recent calibration window). This normalization preserves relative modulation while removing baseline shifts. For features with log-normal distributions (firing rates), apply log transform before z-scoring.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
