# Scope Measurement Execution And Analysis

Execute the measurement, use math channels and cursors for derived parameters, apply protocol decode for bus analysis, and export data for post-processing.

## Inputs

- `deskew-calibration-result`: Channel skew corrections applied
- `differential-measurement-setup`: Math channel configuration
- `timing-accuracy-budget`: Known measurement uncertainty

## Outputs

- `measurement-results`: Captured measurement data with uncertainty bounds and statistical summary (mean, std dev, min, max over population)
- `artifact-assessment`: Identified measurement artifacts vs real signal features, with rationale for each classification
- `protocol-decode-results`: If applicable: decoded bus transactions with timing, errors flagged, and compliance mask test results

## Process

1. Capture the signal and use the scope's automatic measurement functions for frequency, period, rise time, fall time, overshoot, and duty cycle. Record the statistical distribution (min/max/mean/stddev) over at least 1000 acquisitions for each parameter.
2. Use cursors to measure specific intervals that automatic measurements do not cover. For amplitude, use voltage cursors at stable portions of the waveform to avoid measuring overshoot as signal level.
3. Apply math channels for derived measurements: FFT for frequency domain analysis (select Hanning window for spectral leakage reduction, rectangular window only for transients), differentiation for edge rate (dV/dt), and integration for charge or energy.
4. For digital bus analysis, configure protocol decode (I2C, SPI, UART, CAN, USB). Verify the decode matches known good traffic before trusting it on unknown traffic. Use protocol-aware triggers to capture specific transaction types.
5. Distinguish measurement artifacts from real signal behavior. Ringing at the probe's ground-lead resonant frequency is a probe artifact. Ringing at a frequency matching the trace's quarter-wave resonance is real. If in doubt, change the ground lead length: artifact frequencies shift, real signal frequencies do not.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
