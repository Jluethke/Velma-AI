# Filter Physical Realization

Map the lumped element values to a physical implementation: discrete lumped components, microstrip coupled lines, cavity, or ceramic resonator, based on frequency and performance requirements.

## Inputs

- `scaled-element-values`: Actual L and C values
- `filter-schematic`: Filter circuit topology
- `filter-specification`: Frequency, insertion loss budget, power handling, size constraints

## Outputs

- `physical-filter-design`: The physical filter implementation: component selections for lumped, or dimensions for distributed, with layout or mechanical drawing
- `expected-performance`: Predicted insertion loss, return loss, rejection, and group delay from simulation of the physical design

## Process

1. For frequencies below about 1 GHz: use lumped L and C components. Select high-Q inductors (wirewound or multilayer chip) and low-ESR capacitors (C0G/NP0 dielectric for stability). Component Q determines the realized insertion loss: IL increases as Q decreases.
2. For frequencies from 1 to 30 GHz: distributed (transmission line) implementations are usually superior. Coupled microstrip lines for bandpass filters. Stepped impedance for lowpass. Calculate physical dimensions from the electrical lengths and substrate properties.
3. For coupled-line bandpass filters: calculate the even-mode and odd-mode impedances for each coupled section from the prototype values and fractional bandwidth. Then calculate the physical gap and line widths from the substrate parameters using closed-form equations or EM simulation.
4. For cavity or waveguide filters (high power, very low loss): design each resonator for the required unloaded Q, then couple them through irises or probes sized by the coupling coefficients derived from the prototype values: Mk,k+1 = delta/sqrt(gk * gk+1).
5. Simulate the physical design in an EM simulator (for distributed) or circuit simulator with parasitic models (for lumped). Compare the simulated response to the specification. Adjust dimensions or values to compensate for parasitics.
6. Estimate the insertion loss from the component or resonator Q: for a bandpass filter, IL approximately = 4.343 * sum(gk) / (delta * Qu) dB, where Qu is the unloaded Q and delta is fractional bandwidth.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
