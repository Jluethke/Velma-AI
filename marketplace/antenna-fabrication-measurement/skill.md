# Antenna Fabrication Measurement

Fabricate the antenna prototype and measure its performance in an appropriate test facility, comparing to simulation to validate the design.

## Inputs

- `optimized-dimensions`: Final dimensions for fabrication
- `simulated-antenna-performance`: Expected performance to compare against

## Outputs

- `measured-antenna-performance`: Measured S11, gain, radiation pattern, polarization purity, and efficiency, compared to simulation and specification
- `antenna-design-record`: Complete design record: specification, analytical design, simulation results, fabrication details, measurement results, and any design revisions

## Process

1. Fabricate the antenna according to the optimized dimensions. For PCB antennas, use the same substrate material and stackup specified in the simulation. For machined antennas, specify tolerances on critical dimensions.
2. Measure S11 on a calibrated VNA. The measurement includes the connector and any feed transition, which were not always included in simulation. If S11 disagrees with simulation, first suspect the connector transition before changing the antenna.
3. Measure the radiation pattern. For far-field measurements, the minimum distance is 2*D^2/lambda where D is the largest dimension of the antenna. Use an anechoic chamber to suppress reflections, or an outdoor range with a clear Fresnel zone.
4. For near-field measurements (large antennas or high frequencies): scan the near field on a planar, cylindrical, or spherical surface. Transform to far field using Fourier-based algorithms. Near-field ranges are more compact but require more sophisticated equipment and post-processing.
5. Measure gain by comparison: measure the antenna under test against a reference antenna with known gain (standard gain horn). Gain = gain_ref + 20*log10(received_power_AUT / received_power_ref).
6. Measure efficiency: either by the Wheeler cap method (place a conducting cap over the antenna, compare impedance with and without to separate radiation resistance from loss resistance), or by the directivity/gain method (efficiency = gain / directivity, where directivity is computed from the measured 3D pattern).
7. Compare all measured results to simulation. Document discrepancies and their causes. Common causes: substrate dielectric constant variation (especially FR-4), manufacturing tolerances, connector effects, test fixture interactions. Update the simulation model to match measurement for future designs.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
