# Gpr Raw Processing

Apply time-zero correction, gain functions, and frequency filtering to raw GPR radargrams.

## Inputs

- `raw-radargrams`: GPR profiles as time-domain traces with position markers
- `acquisition-parameters`: Antenna frequency, time window, sampling rate, and survey geometry

## Outputs

- `processed-radargrams`: Gain-corrected, filtered radargrams ready for interpretation
- `processing-log`: Record of all processing steps and parameters applied

## Process

1. Apply time-zero correction to align all traces to the ground surface
2. Apply a gain function (SEC or AGC) to compensate for geometric spreading and attenuation
3. Bandpass filter to remove low-frequency noise (wow) and high-frequency noise
4. Apply background removal to suppress horizontal banding from system ringing

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
