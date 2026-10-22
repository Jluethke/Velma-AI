# Spectrum Power Measurement

Measure RF signal power, spectral content, and spurious emissions using spectrum analyzers and power meters with appropriate detector and bandwidth settings.

## Inputs

- `signal-description`: Signal to measure: CW, pulsed, modulated, or noise-like. Approximate frequency and power level.
- `measurement-requirement`: What needs to be measured: absolute power, spectral shape, spurious emissions, phase noise, or occupied bandwidth

## Outputs

- `spectrum-measurement-result`: Measured spectrum or power with the instrument settings used and any corrections applied
- `measurement-accuracy-assessment`: Assessment of measurement accuracy including instrument uncertainty, mismatch loss, and any corrections

## Process

1. For absolute power measurement: a calibrated power meter (thermal or diode sensor) is more accurate than a spectrum analyzer. Thermal sensors measure true RMS power regardless of waveform (accurate for any signal type, limited dynamic range). Diode sensors are more sensitive but only accurate for CW unless they have a wide dynamic range mode.
2. Spectrum analyzer RBW selection: RBW determines the noise floor and frequency resolution. For CW signals, RBW does not affect the displayed amplitude (the signal is narrower than any RBW). For noise-like signals, displayed power changes with RBW: P_displayed = P_noise_density + 10*log10(RBW). For modulated signals, set RBW wider than the signal bandwidth to capture total power, or use channel power measurement mode.
3. Spectrum analyzer VBW: video bandwidth smooths the display. For noise measurements, set VBW <= RBW/3 to reduce measurement variance. For CW, VBW can equal RBW for faster sweep.
4. Detector type: peak detector shows the highest instantaneous value in each display bin (standard for spurious searches). Sample detector samples one point per bin (correct for noise power measurements). Average detector averages all samples in each bin (reduces variance). RMS detector computes true RMS of each bin (best for accurate power measurement of any signal type).
5. For spurious emission measurement: scan a wide frequency range with the RBW set narrow enough to resolve the spurious from the noise floor but wide enough for reasonable sweep time. First do a wide scan to locate spurs, then zoom in on each spur with narrower RBW for accurate level measurement.
6. Apply corrections: cable loss between DUT and instrument (add it back to the measured power), mismatch loss (from VSWR of source and load), and any attenuator at the instrument input. For precise measurements, measure the cable loss on the VNA and apply it frequency by frequency.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
