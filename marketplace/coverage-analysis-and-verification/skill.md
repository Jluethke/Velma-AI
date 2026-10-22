# Coverage Analysis And Verification

Propagate the constellation and verify coverage percentage, gaps, and revisit statistics.

## Inputs

- `walker_pattern`: Geometry to propagate.
- `elevation_mask`: Mask applied when counting visibility.
- `satellite_count`: Number of satellites in the simulation.

## Outputs

- `coverage_statistics`: Percent coverage and fold achieved over the service area.
- `gap_analysis`: Maximum and mean coverage gap per grid point.
- `revisit_distribution`: Distribution of revisit times across latitude.

## Process

1. Propagate every satellite including the oblateness (J2) effect and grid the service area in latitude and longitude.
2. At each time step and grid point count satellites above the elevation mask, then compute percent coverage, maximum gap, and mean revisit over the simulation.
3. Verify the fold requirement is met everywhere it is needed (for example four-fold visibility for navigation across the service area).
4. Keep the nodal regression rate from J2 common across planes so the relative pattern holds; a mismatch lets planes drift apart over months.
5. Summarize with a figure of merit such as worst-case gap or percent of area meeting the target, and iterate the pattern if gaps exceed the limit.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
