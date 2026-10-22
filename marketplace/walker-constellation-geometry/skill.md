# Walker Constellation Geometry

Lay out a Walker pattern and set the satellite count, plane count, and phasing.

## Inputs

- `orbit_selection`: Orbit regime and altitude.
- `coverage_requirements`: Coverage type that sets the pattern family.

## Outputs

- `walker_pattern`: Walker Delta or Star notation for the constellation.
- `satellite_count`: Total satellites and satellites per plane.
- `plane_phasing`: Inter-plane phase offset between adjacent planes.

## Process

1. Describe a Walker Delta constellation by inclination : T / P / F, where T is total satellites, P is equally spaced planes, and F (0 to P-1) sets the phasing.
2. Place P planes with right ascension of the ascending node spread evenly, and satellites evenly within each plane; the inter-plane phase step is F * 360 / T degrees.
3. Use a Walker Star pattern (planes spread over 180 deg with near-polar inclination) for continuous polar and global coverage, accepting a seam where counter-rotating planes meet.
4. Worked case: the global-navigation reference design uses 24 satellites in 6 planes at 55 deg, written 55:24/6/2.
5. Estimate the minimum total count from the footprint half-angle and the fold requirement, then refine with a coverage simulation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
