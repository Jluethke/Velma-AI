# Cascade Loop Tuning

Tune the cascaded current-velocity-position control loops from the innermost loop outward.

## Inputs

- `servo-model`: Plant transfer functions for current, velocity, and position loops
- `performance-requirements`: Bandwidth and damping for each loop

## Outputs

- `cascade-controller`: Current loop PI, velocity loop PI, and position loop P (or PID) gains with feedforward terms
- `loop-bandwidth-hierarchy`: Verified bandwidth separation between loops: current >> velocity >> position

## Process

1. Tune the current loop first (innermost). Use PI control. Set the proportional gain for desired current loop bandwidth (typically 1-5 kHz). The integral gain cancels the motor electrical time constant L/R. Verify that the current loop bandwidth is at least 5x the velocity loop bandwidth target.
2. Tune the velocity loop. Use PI control. The velocity plant (with closed current loop) is approximately K_t / (J*s) at frequencies below the current loop bandwidth. Set proportional gain for desired velocity loop bandwidth (typically 50-500 Hz). Integral gain provides zero steady-state velocity error; set it for crossover at 1/10 to 1/5 of the velocity loop bandwidth to avoid interaction with the proportional action.
3. Add a notch filter in the velocity loop if the mechanical resonance is within 3x of the velocity loop bandwidth. The notch center frequency should match the resonance frequency from the measured frequency response (not from calculation, as manufacturing tolerance shifts the resonance). Notch depth should be just enough to suppress the resonance peak below 0dB; excessive notch depth wastes phase margin.
4. Tune the position loop (outermost). Use proportional gain (Kp) to set the position loop bandwidth (typically 10-100 Hz). The position loop bandwidth must be at most 1/3 to 1/5 of the velocity loop bandwidth. Higher Kp gives faster positioning but less damping; position loop damping comes from the velocity loop, not from a derivative term.
5. Add velocity feedforward: for trajectory tracking, the feedforward term is Kv_ff * velocity_command applied directly to the velocity loop reference, bypassing the position loop. Set Kv_ff = 1.0 for ideal feedforward (position error is zero during constant-velocity motion). Add acceleration feedforward Ka_ff * acceleration_command * J / K_t applied to the current command for improved transient tracking.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
