# Pointing Budget And Control Design

Build the pointing error budget from all contributing sources, design the control algorithm, and verify performance through simulation including the safe mode and detumble sequence.

## Inputs

- `sensor-suite`: Sensors with accuracy specifications
- `actuator-set`: Actuators with torque and momentum capacity

## Outputs

- `pointing-budget`: RSS error allocation across all sources (sensor, alignment, control, structural flex, thermal distortion)
- `control-design`: Control law parameters, stability analysis, simulation results, safe mode and detumble design

## Process

1. Build the pointing budget as an RSS of independent error sources. Sensor noise: from star tracker noise equivalent angle (typically 1-5 arcsec per axis, 1-sigma). Sensor alignment: measured during integration (typically 10-50 arcsec). Structural flexibility: first structural mode interaction with control bandwidth. Thermal distortion: structural deformation from temperature gradients. Control error: steady-state error from the control law.
2. Design the attitude control law. For three-axis stabilized spacecraft, a PD controller is the baseline: T_command = -K_p * theta_error - K_d * omega_error. Select gains for the desired bandwidth: omega_n = sqrt(K_p / I) and damping ratio zeta = K_d / (2*sqrt(K_p*I)). The bandwidth must be below the first structural mode frequency (factor of 5-10 separation) and above the disturbance rejection frequency.
3. Analyze stability using classical and modern methods. Bode plot: verify phase margin > 30 degrees and gain margin > 6 dB. Nichols chart for multi-input-multi-output systems. Include actuator dynamics (wheel motor transfer function), sensor noise filter, and structural flexibility (notch filters at structural mode frequencies).
4. Design the safe mode. When an anomaly is detected (attitude error exceeds threshold, sensor failure, power anomaly), the spacecraft enters safe mode: reduce to minimum power loads, orient for maximum solar array illumination and thermal safety, use the most reliable sensors and actuators (often sun sensors and magnetorquers). Safe mode must be autonomously recoverable without ground intervention for at least 72 hours.
5. Design the detumble algorithm for initial deployment or post-anomaly recovery. B-dot control: command the magnetorquers proportional to the negative rate of change of the magnetic field: M_command = -k * dB/dt. This drives the tumble rate toward zero without requiring attitude knowledge. Calculate the expected detumble time from the initial tip-off rate and the available magnetic torque.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
