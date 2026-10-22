# Adsorption Process Design

Design an adsorption-based separation including adsorbent selection, breakthrough analysis, and regeneration cycle design.

## Inputs

- `feasible-methods`: Adsorption identified as feasible
- `mixture-composition`: Feed composition and flow rate
- `separation-targets`: Product purity and recovery targets

## Outputs

- `adsorbent-specification`: Adsorbent material, particle size, and bed loading
- `bed-design`: Bed dimensions, number of beds, and cycle timing
- `regeneration-design`: Regeneration method (TSA, PSA, VSA) with energy requirement

## Process

1. Select the adsorbent: activated carbon for organics from water or air, zeolite for gas separation by molecular size (3A, 4A, 5A, 13X by target molecule), silica gel or alumina for drying, ion exchange resins for ionic species. Measure the adsorption isotherm (Langmuir, Freundlich, or BET) at operating conditions.
2. Calculate the mass transfer zone (MTZ) length from breakthrough experiments at representative conditions. The MTZ determines how much of the bed capacity is used before breakthrough. Short MTZ (sharp front) means high bed utilization; long MTZ means either a larger bed or more frequent cycling.
3. Size the bed: bed volume = (feed rate * cycle time * loading capacity) / bed density. Set the bed length to be at least 3 to 5 times the MTZ length for acceptable utilization. Two beds minimum for continuous operation (one adsorbing, one regenerating).
4. Design the regeneration cycle: for TSA (temperature swing), calculate the heat required to raise the bed to desorption temperature plus the heat of desorption. For PSA (pressure swing), calculate the purge gas volume and compression energy. For VSA, size the vacuum pump for the required pressure and flow.
5. Optimize cycle timing: adsorption time is set by breakthrough. Regeneration time must be shorter than adsorption time to maintain continuous feed processing. Include pressurization, depressurization, and cooling steps in the cycle time. Use simulation (e.g., Aspen Adsorption or COMSOL) to optimize the cycle for minimum energy or maximum productivity.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
