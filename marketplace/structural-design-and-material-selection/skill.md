# Structural Design And Material Selection

Design the spacecraft structure (primary and secondary) using the derived loads, select materials qualified for the space environment, and plan the structural test program.

## Inputs

- `design-load-cases`: Combined loads with factors of safety
- `frequency-requirements`: Minimum natural frequency constraints

## Outputs

- `structural-design`: Primary structure configuration, panel construction, fastener sizing, mass summary
- `test-plan`: Structural test program (static, sine, random vibration, acoustic, shock) with test levels and acceptance criteria

## Process

1. Select the primary structure configuration. For small spacecraft (<500 kg), a machined or sheet-metal central cylinder or box frame. For larger spacecraft, a composite or aluminum honeycomb sandwich panel construction with a central thrust tube or cylinder. The thrust tube carries launch loads from the adapter interface to the upper spacecraft.
2. Select materials. Aluminum alloys (6061-T6, 7075-T73) are standard for machined structures. Aluminum honeycomb sandwich (5056 core, 2024 or CFRP facesheets) for panels: specific stiffness is excellent and the natural frequency scales as sqrt(EI/m). CFRP offers higher specific stiffness but requires careful CTE management (near-zero CTE is achievable with layup selection). Titanium for high-temperature or high-strength-to-weight fittings.
3. Verify outgassing per ASTM E595: total mass loss < 1.0%, collected volatile condensable material < 0.1%. All adhesives, coatings, potting compounds, and cable insulation must pass. Radiation tolerance: verify that polymers and composites maintain strength after the mission total dose.
4. Perform structural analysis. For each load case, check stress against allowable (margin of safety = allowable/applied - 1 > 0). Check buckling of thin-walled sections using classical buckling formulas with knockdown factors (NASA SP-8007 for cylinders). Check fastener loads against pullout and shear allowables. Verify the fundamental frequency exceeds the launch vehicle requirement using finite element analysis.
5. Define the structural test program. Static test: apply limit loads and verify no permanent deformation, then apply ultimate loads and verify no failure. Sine vibration: sweep through the frequency range at qualification levels to verify no resonance below the minimum frequency and no structural damage. Random vibration: apply the PSD at qualification level for qualification duration (typically 3 minutes per axis). Acoustic test for large or deployable structures. Shock test to simulate separation events.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
