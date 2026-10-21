# Observing Run Scheduler

Build the observing run schedule: order targets by hour angle, insert calibration frames, and plan for weather contingencies.

## Inputs

- `visibility-windows`: When each target is observable
- `exposure-plan`: Time required per target
- `overhead-estimate`: Slew, readout, and calibration time

## Outputs

- `night-schedule`: Minute-by-minute schedule for each night with targets, calibrations, and contingencies
- `calibration-plan`: Bias, flat, dark, and standard star schedule
- `backup-targets`: Lower-priority targets for poor conditions or early completion

## Process

1. Order targets to minimize slew time and stay near the meridian
2. Insert flat fields at twilight and biases and darks at start and end
3. Schedule photometric or spectrophotometric standards throughout the night
4. Add backup targets for weather losses or schedule gaps

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
