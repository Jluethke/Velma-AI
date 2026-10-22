# Laser Beam Characterization

Measure and verify beam quality, power, pointing stability, and spectral properties against requirements.

## Inputs

- `resonator-layout`: Designed cavity configuration
- `beam-quality-requirement`: Target M-squared and specifications
- `power-requirement`: Target output power or energy

## Outputs

- `beam-quality-report`: Measured M-squared, beam profile, pointing stability, spectral width
- `power-performance-data`: Slope efficiency, threshold, power stability over time
- `safety-classification`: IEC 60825 class and required engineering controls

## Process

1. Measure M-squared per ISO 11146. Use a focusing lens and camera or scanning slit to measure beam radius at multiple positions through a focus. Fit to w(z) = w0 * sqrt(1 + (M^2 * lambda * z / (pi * w0^2))^2). A perfect TEM00 gives M^2 = 1.0. Multimode beams give M^2 > 1.
2. Measure power and efficiency. Record output power vs pump power (slope efficiency curve). Slope efficiency eta_s = (lambda_p/lambda_l) * eta_abs * eta_mode * eta_q * T/(T+L) where T is output coupler transmission, L is intracavity loss, eta_q is quantum efficiency. Compare to design prediction.
3. Measure spectral properties. For CW single-frequency lasers, use a scanning Fabry-Perot interferometer (linewidth). For pulsed, use an optical spectrum analyzer. For ultrafast, measure the autocorrelation (pulse duration) and spectrum to compute the time-bandwidth product (transform-limited: 0.44 for sech^2, 0.315 for Gaussian).
4. Measure pointing stability. Use a position-sensitive detector (PSD) or camera to record beam centroid over time. Specify in microradians RMS. Environmental vibration and thermal drift are the usual limits.
5. Classify per IEC 60825-1. Calculate the accessible emission limit (AEL) from wavelength, exposure duration, beam diameter, and divergence. Class 1 requires no controls. Class 3B and 4 require interlocks, eyewear, warning signs, key switch. Document the nominal hazard zone (NHZ) distance for Class 4.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
