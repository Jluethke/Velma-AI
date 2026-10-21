# Instrument Calibration Protocol

Write a calibration protocol for each instrument: reference standards, procedure, acceptance criteria, and recalibration schedule.

## Inputs

- `sensor-specifications`: Instruments to calibrate
- `dominant-error-sources`: Which calibrations matter most for accuracy

## Outputs

- `calibration-protocol`: Step-by-step calibration procedure per instrument with reference standards
- `acceptance-criteria`: Pass/fail thresholds and drift limits
- `calibration-schedule`: When to recalibrate during the experiment

## Process

1. Select a traceable reference standard for each instrument
2. Write the calibration procedure (apply known input, record response, fit)
3. Set acceptance thresholds based on the uncertainty budget allocation
4. Define recalibration triggers (time interval, temperature shift, physical disturbance)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
