# Iv Curve Measurement

Measure current-voltage characteristics of the semiconductor device to extract threshold voltage, transconductance, and on-off ratio.

## Inputs

- `device-under-test`: Semiconductor device or test structure with probe contacts
- `measurement-conditions`: Temperature, sweep range, compliance, and step size

## Outputs

- `iv-data`: Current-voltage curves (transfer and output characteristics)
- `extracted-parameters`: Threshold voltage, transconductance, on-off ratio, subthreshold swing

## Process

1. Set up the probe station and source-measure unit with the specified sweep parameters
2. Measure the transfer characteristic (Id vs Vg at fixed Vd) for threshold and transconductance extraction
3. Measure the output characteristic (Id vs Vd at multiple Vg) for saturation and linearity assessment
4. Extract the key device parameters using standard methods (linear extrapolation, max-gm)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
