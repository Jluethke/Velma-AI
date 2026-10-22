# Matching Network Verification

Verify the matching network performance through simulation and measurement, iterating if necessary to meet the return loss specification across the required bandwidth.

## Inputs

- `adjusted-element-values`: Parasitic-corrected element values
- `parasitic-model`: Component and PCB parasitic models
- `frequency-requirements`: Bandwidth and return loss targets

## Outputs

- `matching-verification-result`: Measured or simulated S11 across the band, confirming return loss meets spec, with comparison to the designed response
- `matching-sensitivity-analysis`: Sensitivity of the match to component tolerances and temperature, with worst-case return loss estimate

## Process

1. Simulate the complete matching network in a circuit simulator with component models that include parasitics. Compare simulated S11 to the return loss target across the band.
2. If the simulated match does not meet spec, adjust element values. Use optimization if available, but understand what the optimizer is changing and why.
3. Fabricate the matching network on the target PCB. Measure S11 with a calibrated VNA. Compare to simulation.
4. If measured and simulated results disagree, the model is wrong. Common causes: inaccurate PCB dielectric constant, unmodeled coupling between components, incorrect component parasitic model. Fix the model before changing component values.
5. Perform a tolerance analysis: sweep each component value across its tolerance range (typically 5% for capacitors, 10% for inductors) and plot the worst-case return loss. If worst case fails the spec, tighten tolerances or redesign with more margin.
6. Document the final matching network: schematic, element values with part numbers, layout guidelines (keep inductors away from ground plane edges, orient to minimize coupling between elements), and the measured S-parameters.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
