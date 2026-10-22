# Rotor Model Construction

Build the rotor-bearing-support model for lateral and torsional dynamics analysis.

## Inputs

- `rotor-geometry`: Shaft dimensions, disk locations and masses, coupling details, and overhung components
- `bearing-data`: Bearing type, geometry, clearance, preload, and lubricant properties for dynamic coefficient calculation
- `operating-conditions`: Speed range, load cases, and process conditions affecting bearing performance

## Outputs

- `lateral-model`: Rotor-bearing model with stiffness and damping matrices for lateral dynamics (forward and backward whirl)
- `torsional-model`: Lumped inertia and stiffness model for torsional vibration analysis
- `critical-speed-map`: Plot of undamped critical speeds vs bearing stiffness showing the sensitivity to support conditions

## Process

1. Model the shaft as a series of beam elements with mass, stiffness (EI), and gyroscopic effects. Include disks as lumped mass and inertia. Model the shaft as a Timoshenko beam if the length-to-diameter ratio is less than 10 (includes shear deformation).
2. Calculate bearing dynamic coefficients (stiffness and damping in 4 DOF: kxx, kxy, kyx, kyy and cxx, cxy, cyx, cyy) from the bearing geometry, clearance, speed, and load. For journal bearings: solve the Reynolds equation. For tilting-pad bearings: solve for each pad, then assemble. Cross-coupled stiffness (kxy, kyx) drives instability and must be captured.
3. Include support structure flexibility if the bearing pedestals are not rigid compared to the bearing stiffness. Add pedestal mass and stiffness to the model. This can lower critical speeds compared to a rigid-support assumption.
4. Build the torsional model: lump inertias at each disk, coupling, and gear. Stiffness of each shaft segment is GJ/L. Model couplings with their torsional stiffness and damping. Model gears as a speed ratio with reflected inertia and stiffness.
5. Generate the critical speed map: plot undamped natural frequencies vs bearing stiffness over a wide range. This shows how sensitive each critical speed is to bearing condition and identifies crossings with operating speed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
