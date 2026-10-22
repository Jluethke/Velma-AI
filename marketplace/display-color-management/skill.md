# Display Color Management

Calibrate the display color output and implement color management: gamma correction, white point, gamut mapping, and uniformity compensation.

## Inputs

- `optical-stack-design`: Spectral output of the display at each primary color
- `optical-performance`: Measured luminance and chromaticity across the panel

## Outputs

- `color-calibration`: 3x3 color matrix (display RGB to XYZ), gamma curves per channel, white point (CCT and chromaticity), color accuracy (average and maximum delta-E 2000 across a test patch set)
- `uniformity-compensation`: Per-pixel or per-zone gain and offset corrections to achieve luminance uniformity < 5% and chrominance uniformity < delta-u'v' 0.005 across the panel

## Process

1. Characterize the display: measure the spectral power distribution of each primary (R, G, B) and white at multiple drive levels (0-255 in 8-bit). From the spectra, compute the CIE 1931 XYZ tristimulus values. The chromaticity of each primary defines the display's color gamut triangle on the CIE diagram.
2. Gamma calibration: the electro-optical transfer function (EOTF) relates the digital input value to the luminance output. Measure L(digital_value) for each channel. For sRGB: the EOTF is approximately gamma 2.2 with a linear segment near black. For HDR (PQ/ST 2084): the EOTF is perceptual quantizer, mapping code values to absolute luminance up to 10,000 nits. Build a 1D LUT per channel to correct the native gamma to the target EOTF.
3. White point: target D65 (6504K) for most applications. Measure the native white point and compute the 3x3 matrix to transform from display RGB to D65-referenced XYZ. Apply this matrix in the display controller or GPU. For cinema (DCI-P3): white point is D63 (6300K, slight green shift from D65).
4. Gamut mapping: when the source content gamut exceeds the display gamut, out-of-gamut colors must be mapped to the nearest displayable color. Perceptual mapping (compress the entire gamut proportionally) for photo/video. Relative colorimetric (clip only out-of-gamut, preserve in-gamut) for proofing. Compute delta-E 2000 for the 24 patches of the ColorChecker chart: target average delta-E < 2.0 for a calibrated display, < 1.0 for a reference monitor.
5. Uniformity compensation: measure the luminance and chromaticity at a grid of points (9x9 minimum) at full white and at 50% gray. Compute the correction gain and offset for each zone to equalize the output. For OLED: per-pixel aging compensation tracks the cumulative usage of each sub-pixel and adjusts the drive current to compensate for differential degradation (the blue sub-pixels degrade faster than red and green).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
