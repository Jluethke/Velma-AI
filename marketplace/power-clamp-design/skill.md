# Power Clamp Design

Design the VDD-to-VSS power clamp that provides the ESD current return path between supply domains, using RC-triggered transient detection.

## Inputs

- `esd-current-paths`: Current paths showing which supply domains need clamping
- `test-current-waveforms`: Peak ESD current and pulse duration

## Outputs

- `power-clamp-circuit`: Sized RC-triggered clamp with transient detector and big FET
- `power-clamp-verification`: Simulated clamping voltage and false triggering immunity

## Process

1. The power clamp must turn on during ESD events (fast transients, 5-100 ns rise time) but remain off during normal power-up (millisecond rise time). An RC network with time constant of 100 ns to 1 us provides this discrimination.
2. RC trigger circuit: R*C time constant must be longer than the ESD pulse duration (approximately 150 ns for HBM) but much shorter than power supply ramp time (typically 1-10 ms). Typical values: R = 10-100 kOhm, C = 1-10 pF. The RC output drives a chain of inverters that turn on the big clamp MOSFET.
3. Size the big MOSFET (N-channel from VDD to VSS): it must carry the full ESD peak current with clamping voltage below the design window limit. Calculate: W_clamp = I_peak / (J_safe * (V_clamp - Vt) / 2), where J_safe is the safe current density per unit width for the ESD pulse duration.
4. Add a feedback path to ensure the clamp stays on for the full ESD pulse duration, even after the RC voltage decays. A self-biasing latch or a sized feedback inverter chain provides this. But ensure the latch releases before VDD ramps up during normal power-on.
5. For multi-domain ICs: place clamps between every supply domain pair that can see ESD current. If domains share a substrate, substrate diodes may provide some path, but dedicated clamps are more reliable and lower impedance.
6. Simulate with a SPICE transient analysis: inject the HBM current waveform (1.33A peak, 10ns rise, 150ns decay) into the VDD rail with VSS grounded. Measure the clamping voltage. Then simulate normal power-up (1V ramp in 1ms) and verify the clamp does not falsely trigger (no supply sag or current spike).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
