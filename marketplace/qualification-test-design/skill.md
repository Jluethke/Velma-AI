# Qualification Test Design

Design qualification tests that demonstrate the product can survive the defined environment with margin, using the correct test levels and durations.

## Inputs

- `thermal-profile`: Operational and storage thermal environment
- `vibration-profile`: Vibration and shock environment
- `combined-environment`: Simultaneous stress conditions

## Outputs

- `thermal-test-plan`: Thermal cycling test: temperature range, ramp rate, dwell time, number of cycles, functional test points during cycling
- `vibration-test-plan`: Random vibration: PSD profile, axes, duration per axis. Sine vibration: sweep rate, amplitude, frequency range. Shock: pulse shape, amplitude, number of pulses per axis
- `qualification-test-sequence`: The order in which environmental tests should be run on the same units to capture cumulative damage effects

## Process

1. Set thermal cycling test parameters. The temperature range is the operational range plus a qualification margin (typically 10C on each end for commercial, 5C for military where the specified range is already wide). Ramp rate: 5 to 15 C/min is typical; faster rates produce more stress but may not be achievable uniformly in a large product. Dwell time: long enough for the product to reach thermal equilibrium, verified by a thermocouple on the slowest-responding component.
2. Calculate the number of thermal cycles from the product lifetime. If the product sees 2 cycles per day for 10 years, that is 7,300 cycles. For qualification, apply a test acceleration factor using Coffin-Manson: fewer cycles at wider temperature range. Document the acceleration model and the assumed activation energy.
3. Set random vibration test parameters. The PSD shape matches the measured or specified environment. The test level includes margin: typically 3dB (factor of 2 in power) above the maximum measured level for qualification, 0dB for acceptance. Duration: 1 hour per axis is common for qualification when the lifetime environment is not well characterized. When it is characterized, use fatigue damage equivalence to calculate the test duration.
4. Sequence the tests to capture cumulative effects. A common sequence: initial functional test, thermal cycling, random vibration, mechanical shock, humidity (if applicable), final functional test. Running thermal before vibration captures weakened solder joints that then fail under vibration. The sequence matters because qualification is a destructive test of margins.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
