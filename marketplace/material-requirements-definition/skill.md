# Material Requirements Definition

Translate the application requirements into material property targets, identifying which properties are constraints (must meet) and which are objectives (want to maximize or minimize).

## Inputs

- `application-description`: What the part does, its operating environment, and expected life
- `functional-loads`: Mechanical, thermal, electrical, and chemical loads the part must survive

## Outputs

- `property-requirements`: Table of material properties with constraint values (pass/fail thresholds) and objective values (more is better or less is better)
- `compatibility-constraints`: Constraints from adjacent materials (galvanic compatibility, CTE matching), manufacturing process, and regulatory requirements (RoHS, REACH, UL flammability)

## Process

1. List every property that matters for this application. For a structural heat sink: thermal conductivity (objective: maximize), yield strength (constraint: minimum), density (objective: minimize), CTE (constraint: must match substrate within 5 ppm/C), machinability, cost per kg.
2. Set hard constraints first. These are pass/fail: if a material fails any constraint, it is eliminated regardless of how well it performs on objectives. Typical constraints: maximum operating temperature, minimum strength, specific regulatory compliance (RoHS eliminates lead alloys for most applications).
3. Define objectives with direction. For each objective property, state whether more is better (thermal conductivity) or less is better (cost, density). Some properties are optimized as ratios: stiffness-to-weight (E/rho) for minimum-weight designs, strength-to-cost for minimum-cost designs.
4. Check for galvanic compatibility with mating materials. The galvanic series ranks metals by their electrode potential in seawater. Metals more than 0.25V apart in the series will corrode when in contact in the presence of an electrolyte. Aluminum (active) bolted to stainless steel (noble) corrodes the aluminum.
5. Identify manufacturing constraints on material selection. Die casting requires alloys with good fluidity (aluminum A380, zinc Zamak). Injection molding requires thermoplastics or thermosets. Sheet metal forming requires ductile alloys with good bend radius capability. Welding requires compatible filler metals and heat-affected-zone properties.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
