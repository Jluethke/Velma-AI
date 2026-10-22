# Coil Winding And Structure

Design the coil winding geometry, structural support, and insulation system for the magnet.

## Inputs

- `conductor-selection`: Chosen superconductor and cable
- `cable-design`: Cable configuration
- `operating-margin`: Temperature and current margins

## Outputs

- `coil-geometry`: Winding cross-section, number of turns, layers or pancakes
- `structural-design`: Support structure, preload, and stress analysis results
- `insulation-system`: Turn, layer, and ground insulation materials and thicknesses

## Process

1. Choose winding method: layer winding (continuous, good for solenoids), single/double pancake winding (good for HTS tape, allows testing of individual pancakes), saddle coils or racetrack for dipoles. Calculate number of turns from required ampere-turns and operating current.
2. Calculate electromagnetic forces: solenoid hoop stress sigma = J * B * r for axial field, axial force from fringe field. Dipole magnets accumulate force toward midplane. Peak stress must remain below conductor yield with safety factor.
3. Design structural support: external support structure (collar, yoke, shell for accelerator magnets), internal support (winding mandrel, banding), bladder-and-key preload system. Target preload to keep conductor in compression during energization (no motion = no quench).
4. Select insulation: polyimide (Kapton) tape for turn insulation, glass-epoxy for ground insulation. Radiation environment dictates dose limit (10^7 Gy for epoxy, higher for cyanate ester). Ensure insulation can withstand quench voltage (turn-to-turn, layer-to-layer, to ground).
5. Model the winding pack: 2D or 3D FEA for field, force, and stress. Include winding tension during fabrication (affects as-wound stress state). Check strain limits: Nb3Sn degrades above 0.3% strain, REBCO above ~0.4% on the tape.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
