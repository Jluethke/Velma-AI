# Detonation Fundamentals And Sizing

Apply detonation physics to engine design: cell size, wave speed, and injection geometry for stable rotating detonation.

## Inputs

- `propellant-combination`: Fuel and oxidizer (H2/air, CH4/O2, JP-10/air, etc.)
- `operating-conditions`: Inlet pressure, temperature, and mass flow rate
- `performance-targets`: Required pressure gain, thrust, and efficiency improvement over deflagration

## Outputs

- `detonation-parameters`: CJ detonation velocity, pressure ratio, cell size for the propellant combination
- `annulus-geometry`: Channel width, diameter, and length for stable detonation propagation
- `injection-design`: Injector element sizing and arrangement for detonation wave compatibility

## Process

1. Calculate the Chapman-Jouguet (CJ) detonation properties for the propellant pair: the CJ velocity is the minimum stable detonation velocity. For H2/air at 1 atm: V_CJ ~ 1960 m/s, pressure ratio p_CJ/p_1 ~ 15.5, temperature ratio T_CJ/T_1 ~ 10. For CH4/air: V_CJ ~ 1800 m/s. These set the pressure gain: the Humphrey cycle (constant-volume heat addition approximation) gives 10 to 15% higher thermal efficiency than the Brayton cycle (constant-pressure).
2. Determine the detonation cell size lambda for the propellant mixture: the cell size is the characteristic length scale of the cellular detonation structure. It depends on mixture composition, pressure, and temperature. For H2/air stoichiometric at 1 atm: lambda ~ 10 to 15 mm. For CH4/air: lambda ~ 200 to 300 mm (much larger, harder to detonate). Cell size decreases with increasing pressure and increasing reactivity.
3. Size the RDE annular channel: channel width must be at least lambda/pi (the detonation cell must fit in the channel). Channel outer diameter is set by mass flow rate: the detonation wave propagates azimuthally while fresh mixture is injected axially. The wave sweeps the channel at V_CJ, consuming the mixture that has accumulated since its last pass. Channel length must allow complete combustion before the products exit.
4. Design the injection system: the injector must refill the channel between successive detonation wave passages. The refill time is the circumference divided by V_CJ (for a single wave) or divided by N * V_CJ (for N co-rotating waves). Injector elements must survive the periodic detonation wave passage (pressure spike of 15 to 30x inlet pressure). Use unlike-doublet or shear-coaxial elements with acoustic impedance mismatch to prevent detonation flashback into the manifold.
5. Predict the number of detonation waves: stable operation can have 1 to 6+ co-rotating waves depending on the channel diameter and mixture reactivity. More waves mean shorter refill time (harder) but more uniform exhaust (better for integration with a turbine). The wave count is not directly controllable; it emerges from the interaction between injection rate, channel geometry, and mixture properties.
6. Estimate the actual pressure gain: the CJ pressure ratio is the theoretical maximum, but mixing losses, incomplete combustion, and parasitic expansion before the detonation wave arrives all reduce the realized pressure gain. Current experimental RDEs achieve 2 to 5% total pressure gain over a conventional combustor at similar conditions. The pressure gain increases with the ratio of detonation wave pressure to the inlet pressure.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
