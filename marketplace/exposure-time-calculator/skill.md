# Exposure Time Calculator

Calculate exposure times for each target and filter combination to reach the required signal-to-noise ratio.

## Inputs

- `target-list`: Target magnitudes and spectral types
- `telescope-specs`: Aperture, detector QE, read noise, dark current, plate scale

## Outputs

- `exposure-plan`: Exposure time, number of frames, and filter for each target
- `snr-estimates`: Expected S/N per target under nominal conditions
- `overhead-estimate`: Total time including readout, slewing, and calibration frames

## Process

1. Model the source signal from magnitude, filter bandpass, and telescope throughput
2. Model noise sources (sky background, read noise, dark current, scintillation)
3. Solve for exposure time to reach target S/N
4. Determine number of sub-exposures to avoid saturation or trailing
5. Sum science time plus overheads for the full schedule

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
