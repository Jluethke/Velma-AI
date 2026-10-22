# Tdr Impedance Measurement

Use time-domain reflectometry to measure transmission line impedance, locate discontinuities, and characterize connectors and vias on PCBs and cables.

## Inputs

- `target-impedance-spec`: Expected impedance (e.g., 50 ohm single-ended, 100 ohm differential) and tolerance
- `measurement-point-list`: List of nets/traces to measure with access point locations

## Outputs

- `impedance-profile`: Impedance vs distance along each trace, with discontinuities identified and located
- `discontinuity-analysis`: For each impedance excursion beyond tolerance: location, magnitude, and probable cause (via transition, connector, layer change, trace width change)
- `differential-pair-balance`: Intra-pair skew and impedance balance for differential pairs

## Process

1. Calibrate the TDR by running the open, short, and load calibration at the probe tips (not at the cable end). The calibration reference plane defines where the measurement starts. For PCB measurements, use a microprobe (GS or GSG) calibrated on an impedance standard substrate (ISS).
2. For single-ended measurements, connect the TDR to one end of the trace. The TDR sends a fast step (typical rise time 35-150ps) and measures the reflected voltage vs time. Convert time to distance using the propagation velocity of the PCB material (typically 6 inches/ns for FR-4 stripline, 7.5 inches/ns for microstrip).
3. Read the impedance profile: a flat line at 50 ohm means controlled impedance. An upward bump indicates higher impedance (trace narrowing, void in reference plane, via transition adding inductance). A downward dip indicates lower impedance (trace widening, excessive via pad capacitance, connector).
4. For differential pairs, run TDR on both the differential mode (odd mode: drive both lines in opposite polarity) and common mode (even mode: drive both lines in same polarity). Differential impedance = 2 * odd-mode impedance. Intra-pair skew appears as a common-mode artifact in the differential measurement.
5. Spatial resolution is limited by the TDR step rise time: resolution approximately equals rise_time * propagation_velocity / 2. A 35ps rise time TDR resolves features about 3mm apart in FR-4. For higher resolution, use a faster TDR or switch to VNA-based frequency-domain measurement and transform to time domain.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
