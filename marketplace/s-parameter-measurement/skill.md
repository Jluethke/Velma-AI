# S Parameter Measurement

Measure the S-parameters of a DUT with proper fixturing, including de-embedding of fixture effects and time-domain techniques for isolating reflections.

## Inputs

- `calibration-procedure`: Completed VNA calibration
- `dut-description`: Device under test: type, connectors, frequency range of interest

## Outputs

- `measured-s-parameters`: S-parameter data (S11, S21, S12, S22) across frequency in Touchstone format, with de-embedding applied if needed
- `measurement-uncertainty-estimate`: Estimated uncertainty in the measured S-parameters from connector repeatability, calibration residuals, and environmental factors

## Process

1. Connect the DUT to the calibrated VNA ports. Use consistent torque on connectors (8 in-lb for SMA, 12 in-lb for N-type) with a torque wrench. Inconsistent connector torque is the single largest source of measurement error in coaxial measurements.
2. Set the VNA parameters: start and stop frequency (matching calibration range), number of points (enough to resolve features; 401 or 801 typical), IF bandwidth (narrower = lower noise floor but slower; 1 kHz for general, 10 Hz for high dynamic range), and power level (in the linear range of the DUT, typically -10 to 0 dBm for passive devices).
3. Measure and inspect all four S-parameters. For a passive reciprocal device, S12 should equal S21. If they differ by more than the measurement uncertainty, check for a bad connection or calibration drift.
4. Use time-domain gating to isolate the DUT response from fixture effects when de-embedding is not practical. Transform the frequency-domain S-parameters to time domain (inverse FFT). Gate (window) around the DUT response, excluding reflections from connectors and fixture transitions. Transform back to frequency domain.
5. For differential (balanced) devices: measure all four single-ended S-parameters of the 4-port, then convert to mixed-mode S-parameters (Sdd, Scc, Sdc, Scd) using the mixed-mode transformation matrix.
6. Estimate measurement uncertainty: connector repeatability (measure, disconnect, reconnect, measure again; the variation is the repeatability uncertainty, typically 0.01 to 0.05 in |S11|). Add calibration residual error, cable stability (flexing cables changes S-parameters), and temperature variation during the measurement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
