# Protection Circuit Verification

Verify power supply protection circuits (OVP, UVP, OCP, SCP, OTP) by measuring trip points, response times, recovery behavior, and fault handling under controlled fault conditions.

## Inputs

- `supply-specification`: Protection circuit specifications: trip points, response times, recovery mode (auto-restart, latch-off, hiccup)
- `efficiency-curve`: Efficiency and thermal data to understand thermal protection context

## Outputs

- `protection-test-results`: Measured trip points, response times, and recovery behavior for each protection circuit
- `startup-shutdown-sequence`: Captured output voltage, input current, and enable signal during startup, shutdown, and power cycling
- `psrr-measurement`: Power supply rejection ratio vs frequency from modulated input voltage to output voltage variation

## Process

1. Test over-current protection: slowly increase load current while monitoring output voltage and input current. Record the current at which OCP triggers (should be within specification tolerance of the trip point). Measure the time from overcurrent to output shutdown using an oscilloscope. Verify recovery mode (auto-restart: output should cycle; latch-off: output stays off until input power cycle).
2. Test over-voltage protection: for supplies with adjustable output or external OVP, slowly increase the output voltage reference while monitoring the output. For fixed supplies, inject a fault condition that raises the output. Record the voltage at which OVP triggers and verify the crowbar or shutdown response. Verify that OVP does not false-trigger during startup overshoot.
3. Test short-circuit protection: with the supply running at nominal load, apply a dead short across the output through a low-inductance path. Measure the peak fault current and the time to current limiting. Verify the supply survives repeated short-circuit cycling (10 cycles minimum) and recovers cleanly each time.
4. Measure startup and shutdown sequence: capture output voltage from pre-bias through soft-start to regulation, and from shutdown command to output zero. Measure inrush current during startup. Verify monotonic startup (no dips or oscillations during soft-start). For sequenced multi-rail supplies, verify the voltage ordering and timing between rails.
5. Measure PSRR: inject a sinusoidal ripple on the input voltage (typically 100mVpp from an audio amplifier in series with the DC supply) and measure the output ripple at the same frequency. Sweep from 100Hz to 1MHz. PSRR = 20*log10(V_in_ripple / V_out_ripple). This reveals the supply's ability to reject input noise at each frequency.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
