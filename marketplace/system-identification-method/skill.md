# System Identification Method

Identify the plant dynamics from experimental data: design excitation signals, collect response data, and extract transfer function or state-space models.

## Inputs

- `plant-description`: Physical system to be controlled, including actuators and sensors
- `performance-requirements`: Required bandwidth, settling time, steady-state accuracy, and disturbance rejection

## Outputs

- `plant-model`: Identified plant model (transfer function or state-space) with uncertainty bounds
- `model-validation`: Validation results showing model accuracy on test data not used for identification

## Process

1. Design the excitation signal. The signal must excite the plant across the frequency range of interest (from DC to at least 5x the desired control bandwidth). Options: step input (simple, reveals DC gain and dominant time constant), frequency sweep (sine wave with slowly increasing frequency, directly yields the Bode plot), pseudo-random binary sequence (PRBS: broadband excitation, efficient, good for linear system identification), multisine (sum of sinusoids at selected frequencies, controls the frequency content precisely). Choose amplitude to stay within the linear operating range.
2. Collect and preprocess data. Sample the input and output at a rate at least 10x the highest frequency of interest (Nyquist with margin). Remove DC offset if needed. Apply anti-aliasing filter before sampling. For frequency response identification: compute the FFT of input and output, divide output spectrum by input spectrum to get the frequency response H(jw). For time-domain identification: use the input-output time series directly.
3. Extract the model. Frequency domain: fit a transfer function (poles and zeros) to the measured frequency response using least-squares in the frequency domain, weighting by data quality. Start with a low-order model and increase order until the fit is adequate. Time domain: use prediction error methods (PEM) or subspace identification (N4SID) to fit a state-space model to the input-output data. Select model order using information criteria (AIC, BIC) or by examining the singular values in the subspace method.
4. Validate the model. Split the data: use one portion for identification, another for validation. On the validation data, simulate the model with the measured input and compare the simulated output to the measured output. Compute the fit percentage (NRMSE). A good model should achieve >80% fit on validation data. Also compare the model's frequency response to the measured frequency response: they should agree within the frequency range of interest. Document the model's valid frequency range and amplitude range.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
