# Superconductor Selection And Cable

Select the superconducting material and design the cable configuration based on field, temperature, and current requirements.

## Inputs

- `target-field`: Required magnetic field in Tesla at the operating point
- `operating-temperature`: Target operating temperature in Kelvin
- `bore-or-gap`: Bore diameter or gap dimension for the magnet

## Outputs

- `conductor-selection`: Chosen superconductor material with critical surface parameters
- `cable-design`: Cable architecture with strand count, twist pitch, and current capacity
- `operating-margin`: Temperature and current margin relative to critical surface

## Process

1. Map the operating point onto the critical surface diagram. NbTi: max useful field ~9T at 4.2K, cheap, ductile. Nb3Sn: up to ~16T at 4.2K, brittle (react-and-wind or wind-and-react). REBCO (HTS): 20T+ at 4.2K, up to ~3T at 77K, expensive, anisotropic Jc.
2. Select operating current density at 80% of the critical current at the peak field point (load line analysis). The peak field is always higher than the bore field due to the field enhancement at the conductor.
3. Design the cable: Rutherford cable for accelerator dipoles (flat, compacted, keystoned), cable-in-conduit conductor (CICC) for fusion (forced-flow helium cooling, high current), CORC cable for HTS (helical winding of tapes). Calculate effective current density including stabilizer (Cu) ratio.
4. Determine Cu:SC ratio for stability. Cu carries current during a transient disturbance. Maddock stability criterion for cryostable magnets. For high-performance magnets, operate meta-stably with adequate margin.
5. Calculate temperature margin: T_cs - T_op where T_cs is the current-sharing temperature at operating current and field. Minimum margin is typically 1-2K for NbTi/Nb3Sn, application-dependent for HTS.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
