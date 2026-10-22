# Sysid Nonparametric Estimation

Estimate the system frequency response without assuming a model structure, providing a reality check before parametric fitting.

## Inputs

- `preprocessed-data`: Cleaned input-output time series
- `data-quality-report`: SNR and coherence information

## Outputs

- `frequency-response-estimate`: Magnitude and phase vs frequency with confidence bounds, plus coherence function
- `impulse-response-estimate`: Time-domain impulse response with estimated settling time and dominant time constants

## Process

1. Compute the empirical transfer function estimate (ETFE) using the cross-spectrum divided by the input auto-spectrum. For multisine data, compute directly at excited frequencies for zero-leakage estimates.
2. Smooth the ETFE with windowing (Hann, Hamming) to reduce variance at the cost of frequency resolution. Choose window length to give adequate resolution at the frequencies that matter for control.
3. Compute coherence function. Mark frequency regions where coherence drops below 0.8 as unreliable for model fitting.
4. Extract key features from the frequency response: DC gain, resonance peaks and their frequencies, bandwidth (3dB point), roll-off rate (slope in dB/decade), phase crossover frequency, and apparent time delay from phase slope.
5. Compute impulse response via inverse FFT of the frequency response. Identify dominant time constants from exponential decay envelope. Check for non-minimum phase behavior (initial undershoot in step response).
6. This nonparametric estimate is the ground truth that any parametric model must match. Overlay parametric model frequency response on this estimate during validation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
