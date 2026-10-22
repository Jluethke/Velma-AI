# Mems Readout And Calibration

Design the readout ASIC interface and calibration model to convert raw sensor output to a calibrated measurement.

## Inputs

- `transduction-mechanism`: Electrical signal characteristics from the MEMS element
- `performance-targets`: Required noise, linearity, bandwidth, and drift
- `performance-estimate`: Expected sensitivity and noise from the MEMS design

## Outputs

- `readout-circuit-design`: Front-end amplifier, ADC, and digital processing architecture
- `calibration-model`: Multi-parameter calibration model (scale factor, bias, cross-axis, temperature coefficients)
- `production-test-procedure`: Test sequence for calibration and screening in high-volume manufacturing

## Process

1. Design the analog front-end for capacitive MEMS. Use a charge amplifier or switched-capacitor circuit to convert capacitance change to voltage. The carrier frequency (100 kHz to 1 MHz) is chosen above the 1/f noise corner of the amplifier. Chopper stabilization removes offset drift. The C-to-V sensitivity is V_out = V_drive * delta_C / C_fb. Electronic noise floor must be below the Brownian noise of the MEMS to be mechanically limited.
2. For force-feedback (closed-loop) operation, apply electrostatic force to null the proof mass displacement. This increases bandwidth (well beyond the mechanical resonance), improves linearity (the sensor always operates near its null point), and increases dynamic range. The feedback force is F = epsilon_0 * A * V^2 / (2*g^2). The control loop bandwidth must be 5-10x the signal bandwidth for stability. Sigma-delta force feedback gives a digital bitstream output directly.
3. Build the calibration model. A 6-axis IMU calibration model includes for each axis: scale factor (sensitivity), bias (zero-g offset), cross-axis sensitivity (3 off-diagonal terms), and temperature coefficients for each parameter. Total: (1 scale + 1 bias + 2 cross-axis + 2 temp coefficients) x 6 axes = 36 parameters minimum. Accelerometer bias is calibrated using gravity (rotate to known orientations). Gyroscope bias is measured at rest. Allan variance analysis characterizes noise types (white noise, bias instability, rate random walk).
4. Design the production calibration and test procedure. Multi-point temperature calibration (typically -40C, +25C, +85C) on a turntable or rate table. Measure the response to known inputs (1g gravity orientations for accelerometers, known rotation rates for gyroscopes). Fit the calibration model and store coefficients in non-volatile memory on the ASIC. Screen for outliers (bias out of range, excessive noise, nonlinearity). Total test time per unit at high volume: 10-60 seconds (drives the test cost).
5. Verify the calibrated performance. Apply the calibration model and measure residual errors against traceable references. Key metrics: bias stability (1-sigma over temperature and time), scale factor error (ppm), cross-axis rejection (%), noise density (ug/sqrt(Hz) or deg/hr/sqrt(Hz)), bandwidth (-3dB point). Compare to the datasheet specification. Allan deviation plot shows the noise floor, bias instability, and long-term drift in one chart.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
