# Quench Protection Design

Design the quench detection and protection system to safely extract stored energy and limit hot-spot temperature.

## Inputs

- `coil-geometry`: Winding configuration and number of turns
- `structural-design`: Support structure design
- `insulation-system`: Insulation design

## Outputs

- `quench-detection-scheme`: Voltage tap arrangement, threshold, and detection time
- `energy-extraction-design`: Dump resistor value, switch, and discharge time constant
- `hot-spot-temperature`: Peak conductor temperature during quench

## Process

1. Calculate stored energy E = 0.5 * L * I^2. For large magnets this can be 100s of MJ to GJ. This energy must be dissipated safely during a quench.
2. Design quench detection: balanced voltage taps (bridge circuit) cancel inductive voltage, detect resistive voltage from normal zone. Detection threshold typically 100-500 mV. Detection + validation time target: 50-200 ms total.
3. Calculate hot-spot temperature using adiabatic approximation: integral of J^2 dt = f(T_max) - f(T_initial) where f(T) = integral of C(T)/rho(T) dT for the composite conductor. Target T_max < 300K (below insulation damage) or 150K (for ITER-class).
4. Design protection heaters (or CLIQ units for LHC-type magnets) to propagate the quench rapidly through the entire winding, distributing energy and reducing hot-spot temperature. Heater firing delay must be fast enough after detection.
5. Size the dump resistor: V_max = I * R_dump, constrained by insulation voltage rating. Discharge time constant tau = L / R_dump. Trade-off: higher R_dump reduces hot-spot temperature but increases terminal voltage. For series magnets, quench-back from eddy currents in support structure provides additional protection.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
