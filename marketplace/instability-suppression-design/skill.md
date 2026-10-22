# Instability Suppression Design

Design damping devices and injector modifications to suppress identified instabilities.

## Inputs

- `stability-rating`: Which modes are unstable or marginally stable
- `acoustic-mode-map`: Mode frequencies and shapes
- `chamber-geometry`: Chamber dimensions for fitting damping devices

## Outputs

- `damping-device-design`: Baffles, acoustic cavities, or absorber specifications
- `injector-modifications`: Changes to injection pattern or element design for stability
- `predicted-stability-improvement`: Expected increase in damping rate from each modification

## Process

1. Baffles: radial blades extending from the injector face into the chamber, typically 3-8 blades for tangential modes. Baffles break up the tangential velocity field at the injector face. They must extend far enough into the chamber to intersect the pressure antinode (typically 1/4 to 1/3 of chamber diameter depth). The F-1 used baffles to solve 1T instability.
2. Acoustic cavities (Helmholtz resonators or quarter-wave tubes): tuned absorbers mounted in the chamber wall near the injector end. They absorb acoustic energy at the resonant frequency. Multiple cavities at different depths cover a range of frequencies. The SSME uses acoustic cavities.
3. Acoustic absorber rings: an annular slot or series of holes around the chamber periphery, backed by a tuned cavity. Acts as a distributed absorber for tangential modes. Effective but adds complexity and potential leak paths.
4. Injector modifications: changing element spacing, orifice size, or element type can detune the combustion response from the acoustic mode. Unlike-doublet to like-doublet conversion, or finer atomization, often improves stability. But each change affects performance and heat transfer.
5. The development approach is iterate: predict modes, design damping, test with bombs, measure stability margin, modify if insufficient. Budget at least 3-6 months for stability development on a new injector design. Some engine programs have spent years on stability alone.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
