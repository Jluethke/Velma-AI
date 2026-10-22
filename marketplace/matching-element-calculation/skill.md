# Matching Element Calculation

Calculate the element values for the selected matching network topology using analytical synthesis or Smith chart graphical methods.

## Inputs

- `load-impedance-data`: Complex load impedance at center frequency
- `selected-topology`: The matching topology chosen
- `frequency-requirements`: Center frequency and system impedance

## Outputs

- `element-values`: Calculated L and C values (or transmission line lengths and impedances) for each element in the network
- `network-schematic`: The matching network schematic showing element placement, values, and the signal path from source to load

## Process

1. For an L-network with series L and shunt C (load impedance in the high-impedance region): Q = sqrt(R_high/R_low - 1). X_series = Q * R_low. B_shunt = Q / R_high. Then L = X_series / (2*pi*f), C = B_shunt / (2*pi*f).
2. For an L-network, also absorb the load reactance. If the load has reactance jX_load, the series element must resonate it out. This modifies the required series element value.
3. For a pi-network: choose the desired Q (which sets bandwidth). Calculate the virtual resistance R_v = R_high / (1 + Q^2) if R_v < R_low, increase Q. Then synthesize two back-to-back L-networks through R_v.
4. For quarter-wave transformers: Z_transformer = sqrt(Z_source * Z_load) for a single section. For multi-section Chebyshev: use the Collin synthesis tables for the impedance of each section given the passband ripple and number of sections.
5. Verify each element value is physically realizable. Inductors below 0.5 nH or above 100 nH at RF may be impractical. Capacitors below 0.1 pF are dominated by parasitics. Flag any unrealizable values.
6. Convert ideal element values to nearest standard values if using off-the-shelf components, and note the sensitivity of the match to component tolerance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
