# Test Instrumentation Selection

Select sensors for each measured quantity by range, accuracy, and bandwidth, and plan their installation and calibration.

## Inputs

- `test-matrix`: The runs and the quantities each run must measure
- `measured-quantities`: The physical quantities (strain, temperature, pressure, acceleration, load, displacement) with expected magnitude and frequency content

## Outputs

- `sensor-plan`: The sensor type, range, accuracy, and location for each measurement channel, with mounting and wiring approach
- `calibration-plan`: The calibration traceability, pre- and post-test calibration checks, and the uncertainty budget per channel

## Process

1. Pick the sensor range to sit the expected signal in the upper half of the range without clipping the peaks. A load cell sized at 10x the expected load wastes resolution; one sized at 1.1x risks clipping a transient. Allow headroom for overshoot and the worst-case abort condition.
2. Match sensor bandwidth to the physics. Static strain needs only DC to a few Hz; vibration and shock need sensors and mounts flat to well above the highest frequency of interest. A strain gauge bonded for static load is useless for a 2 kHz resonance; an accelerometer's mounted resonance must sit well above the measured band.
3. Build the per-channel uncertainty budget. Combine sensor accuracy, signal-conditioning error, data-acquisition quantization, and installation error (gauge misalignment, thermal output, lead-wire resistance) in a root-sum-square. A measurement with 8% uncertainty cannot confirm a 5% effect; fix the instrumentation before the test, not in the analysis.
4. Plan installation to the environment. Temperature-compensate strain gauges and use three-wire hookup for lead resistance; heat-sink or shield thermocouples from radiant sources; mount accelerometers with stud or adhesive matched to the frequency; locate pressure taps away from flow separation. Installation error usually dominates sensor spec error.
5. Define calibration traceability and pre/post checks. Calibrate against standards traceable to a national reference, record calibration dates and due dates, and run a known-input check before and after the test so a mid-test drift is detectable. A channel that fails its post-test calibration check puts its data in question.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
