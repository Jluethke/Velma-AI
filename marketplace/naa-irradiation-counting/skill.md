# Naa Irradiation Counting

Irradiate samples in the reactor and measure gamma spectra at timed decay intervals.

## Inputs

- `prepared-samples`: Sealed sample and standard vials
- `irradiation-plan`: Flux position and duration

## Outputs

- `gamma-spectra`: Measured gamma spectra at each counting interval for all samples and standards
- `counting-log`: Detector geometry, live time, dead time, and decay time for each measurement

## Process

1. Irradiate the sample set at the planned reactor position and neutron flux
2. After irradiation, allow short-lived isotopes to decay to reduce dead time
3. Count samples on the HPGe detector at scheduled intervals (short, medium, long decay)
4. Record live time, dead time, sample-to-detector distance, and spectrum file for each count

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
