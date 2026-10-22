# Spike Detection And Sorting

Detect action potential waveforms from cleaned extracellular recordings and sort them into putative single neuron clusters using feature extraction and clustering.

## Inputs

- `cleaned-neural-data`: Artifact-cleaned high-pass filtered neural recording (300-6000 Hz bandpass)

## Outputs

- `sorted-spike-trains`: For each identified neuron: timestamps of spikes, mean waveform, cluster quality metrics (isolation distance, L-ratio, ISI violation rate)
- `spike-sorting-quality-report`: Number of single units, multi-units, and noise clusters per channel, with quality metrics

## Process

1. Bandpass filter the cleaned data to 300-6000 Hz (4th-order Butterworth, zero-phase). Detect spikes by threshold crossing: set threshold at -4 to -5 times the median absolute deviation (MAD) of the filtered signal divided by 0.6745 (outlier-resistant noise estimate from Quiroga et al.). Extract 1.5-ms waveform snippets centered on each threshold crossing (typically 48 samples at 30 kSps: 16 pre, 32 post).
2. Extract features for clustering. Principal Component Analysis (PCA): compute the first 3-6 PCs of the waveform matrix. These capture waveform shape differences between neurons (peak height, trough width, asymmetry). Alternative: wavelet decomposition coefficients selected by Lilliefors test for non-normality (features that best separate clusters).
3. Cluster the feature space into putative single units. Gaussian Mixture Model (GMM): fit K Gaussians using expectation-maximization, select K by BIC (Bayesian Information Criterion). Alternative: density-based clustering (DBSCAN) for non-Gaussian clusters. For high-channel-count probes (Neuropixels), use template matching approaches (Kilosort): project data onto a template bank, assign spikes to templates, merge/split templates iteratively.
4. Validate sorting quality. For each cluster: (1) ISI violation rate: fewer than 1% of inter-spike intervals below 1.5 ms refractory period indicates a well-isolated single unit. (2) Isolation distance: Mahalanobis distance between cluster and nearest neighbor, greater than 20 is good. (3) L-ratio: below 0.1 indicates low contamination. (4) Waveform stability across the recording session (drift detection by plotting amplitude over time). Classify units as single-unit (passes all), multi-unit (fails ISI), or noise (fails waveform consistency).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
