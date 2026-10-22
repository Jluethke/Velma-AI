# Antenna Simulation Optimization

Simulate the antenna in a full-wave electromagnetic solver, optimize dimensions to meet specifications, and verify performance across the operating band.

## Inputs

- `antenna-dimensions`: Initial physical dimensions from analytical design
- `feed-design`: Feed mechanism and dimensions
- `antenna-specification`: Target performance parameters

## Outputs

- `simulated-antenna-performance`: S11, gain, radiation pattern (E-plane and H-plane), efficiency, and bandwidth from EM simulation
- `optimized-dimensions`: Final optimized dimensions after simulation refinement, with sensitivity to each parameter

## Process

1. Build the 3D model in the EM simulator (HFSS, CST, FEKO, or similar). Include the ground plane, substrate, feed structure, and any nearby metallic structures that affect the pattern.
2. Set up the simulation: define the excitation port (waveport for waveguide feed, lumped port for probe feed), the boundary conditions (radiation boundary at least lambda/4 from the antenna), and the solution frequency (adaptive mesh refinement at the center frequency).
3. Run the initial simulation. Compare S11 to the impedance bandwidth requirement. If the resonant frequency is off, adjust the element dimensions (length primarily controls frequency, width primarily controls impedance). If the bandwidth is insufficient, consider thicker substrate, stacked patches, or parasitic elements.
4. Verify the radiation pattern: check gain, beamwidth, sidelobe levels, cross-polarization, and back radiation. The E-plane pattern is primarily controlled by the element, the H-plane by the ground plane size.
5. Run a parametric sweep on the most sensitive dimensions to understand tolerance sensitivity. If the design is too sensitive to a parameter, redesign to reduce that sensitivity.
6. For arrays: simulate a single element first, verify its pattern, then simulate the full array (or use infinite array approximation with periodic boundaries for large arrays). Check for scan blindness at the intended scan angles.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
