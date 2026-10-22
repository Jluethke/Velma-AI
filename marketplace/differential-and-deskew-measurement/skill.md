# Differential And Deskew Measurement

Set up differential measurements and perform channel-to-channel deskew to eliminate timing errors when measuring propagation delay, skew, or phase relationships between signals.

## Inputs

- `trigger-configuration`: Trigger setup from prior step
- `acquisition-settings`: Acquisition mode and memory configuration
- `probe-selection`: Probes in use and their characteristics

## Outputs

- `deskew-calibration-result`: Measured and corrected channel-to-channel skew values
- `differential-measurement-setup`: Math channel configuration for differential (Ch1-Ch2) or common-mode ((Ch1+Ch2)/2) measurements
- `timing-accuracy-budget`: Total timing measurement uncertainty from deskew residual, trigger jitter, sample interval, and interpolation

## Process

1. Connect both probes to the same fast-edge calibration signal (scope's built-in cal output or a dedicated deskew fixture with matched outputs).
2. Measure the apparent delay between channels at the 50% crossing. This is the combined deskew error from cable length mismatch and scope channel path differences.
3. Apply deskew correction in the scope's channel setup menu. Verify by re-measuring: residual skew should be under 100ps for sub-nanosecond timing measurements.
4. For differential measurements, configure a math channel as Ch1-Ch2 (differential) or (Ch1+Ch2)/2 (common mode). Verify common-mode rejection by applying the same signal to both probes and confirming the math channel shows near zero.
5. Calculate total timing uncertainty: u_timing = sqrt(u_deskew^2 + u_trigger_jitter^2 + (sample_interval)^2 + u_interpolation^2). For a 5GS/s scope with 50ps deskew residual and 10ps trigger jitter, total uncertainty is roughly 210ps.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
