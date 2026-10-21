# Remote Sensing Calibration

Calibrate ground-based remote sensing instruments (lidar, ceilometer, radiometer, sodar) against radiosonde truth and maintain traceability.

## Inputs

- `instrument-plan`: Remote sensing instruments deployed at the site
- `launch-schedule`: Radiosonde launches providing calibration truth

## Outputs

- `calibration-report`: Bias, RMSE, and correlation against sonde truth for each instrument and variable
- `correction-factors`: Empirical corrections to apply to continuous remote sensing retrievals

## Process

1. Co-locate radiosonde profiles with simultaneous remote sensing retrievals at matching heights
2. Compute bias, RMSE, and Pearson correlation for temperature, humidity, and wind speed profiles
3. Derive height-dependent correction factors and assess their stability across weather regimes
4. Document calibration traceability chain from reference standard to field measurement

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
