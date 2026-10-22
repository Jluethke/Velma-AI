# Antenna Requirements Analysis

Extract antenna requirements from the system specification and determine which antenna types are candidates for the application.

## Inputs

- `system-antenna-need`: System-level antenna requirements: frequency, gain, beamwidth, polarization, bandwidth, size constraints, environment
- `platform-constraints`: Physical constraints: available volume, ground plane size, radome, mounting method, weight limit

## Outputs

- `antenna-specification`: Frequency range, gain (dBi), beamwidth (degrees), polarization (linear/circular), impedance bandwidth (%), efficiency target, sidelobe level
- `candidate-antenna-types`: List of antenna types that can meet the specification with trade-offs noted for each

## Process

1. Define the operating frequency range. Calculate the wavelength: lambda = c/f. This sets the fundamental scale for all antenna dimensions.
2. Define the required gain and beamwidth. These are related: for a single-beam antenna, beamwidth approximately = 70*lambda/D degrees (for a uniformly illuminated aperture of dimension D). Higher gain means narrower beam.
3. Define the polarization: linear (horizontal or vertical), circular (RHCP or LHCP), or dual-polarization. Circular polarization requires either a circularly polarized element or two orthogonal linear elements with 90-degree phase difference.
4. Assess antenna type candidates. Dipole/monopole: simple, omnidirectional, 2 to 5 dBi. Patch: low profile, 5 to 8 dBi, narrow bandwidth (2 to 5% typical). Horn: moderate gain (10 to 25 dBi), wideband, large. Parabolic dish: high gain (25+ dBi), narrow beam. Array: any gain, electronic beam steering possible, highest cost and complexity.
5. Eliminate candidates that cannot fit the platform constraints. A patch antenna requires a ground plane of at least lambda/2 on each side. A parabolic dish requires lambda*10 diameter for 30 dBi gain.
6. Select the most promising type based on the combined constraints. If multiple candidates remain, note the trade-off: patch is smaller but narrower bandwidth; horn is wider band but larger.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
