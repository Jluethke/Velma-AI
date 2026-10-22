# Pdn Impedance Simulation

Simulate the complete PDN including VRM output impedance, all decoupling stages, plane capacitance, and interconnect inductance to verify the target impedance is met across the full frequency range.

## Inputs

- `capacitor-bill-of-materials`: Selected capacitors with SPICE models
- `target-impedance`: PDN target impedance ceiling
- `stackup-cross-section`: PCB stackup for plane capacitance calculation
- `placement-priority-map`: Physical placement constraints

## Outputs

- `pdn-impedance-curve`: Simulated PDN impedance vs frequency at the IC power pin, showing contribution of each stage
- `margin-analysis`: Margin between simulated impedance and target at each frequency decade, identifying the tightest point
- `plane-capacitance-contribution`: Calculated plane pair capacitance and the frequency range where it dominates the PDN impedance

## Process

1. Build the PDN circuit model: VRM output impedance (from vendor model or measured data) in series with bulk cap bank, MLCC banks at each stage, plane pair capacitance (C_plane = epsilon_0 * epsilon_r * A / d where A is overlap area and d is dielectric thickness), and mounting inductance for each component.
2. Include the via and trace inductance from each capacitor to the IC power pin. Use 1 nH/mm for traces and 0.5 nH per via as first-order estimates. For critical paths, extract the actual inductance from a 3D field solver.
3. Run AC impedance simulation from 1 Hz to 10 GHz. Plot the result on a log-log impedance vs frequency chart overlaid with the target impedance line. Identify any frequency where the simulated impedance exceeds the target.
4. Calculate margin at each frequency decade. The tightest margin point is the design's vulnerability. If margin is less than 3 dB (factor of 1.4) at any point, the design is at risk from manufacturing variation and component tolerance. Add capacitors or redesign the plane geometry to increase margin.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
