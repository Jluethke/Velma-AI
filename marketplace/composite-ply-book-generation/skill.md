# Composite Ply Book Generation

Turn the stacking sequence into a buildable ply book: ply boundaries, flat patterns, layup sequence, splice and drop-off rules, and debulk schedule.

## Inputs

- `stacking-sequence`: The validated and margin-checked ply stack
- `cure-process`: The selected cure process and tooling approach that the layup must support

## Outputs

- `ply-book`: The ordered ply-by-ply layup instruction: each ply's material, orientation, boundary, and sequence number
- `flat-patterns`: The flat developed shape of each ply for cutting, with fiber-direction reference and splice locations

## Process

1. Generate each ply's boundary and flatten it to a cutting pattern. For contoured parts, develop the flat pattern accounting for draping (fibers shear over double curvature), and mark the 0-degree fiber reference on every pattern so the cutter and the layup technician orient it correctly.
2. Define ply drop-offs and taper rules for thickness transitions. Drop interior plies, not surface plies; taper no steeper than about 1 ply per 10 to 20 times ply thickness; stagger drop locations so they do not stack into a single weak line. Abrupt drops create delamination initiation sites.
3. Set splice and overlap rules. Butt-splice unidirectional plies with a small gap controlled to within a few millimeters, stagger splices between plies so no two adjacent plies splice at the same location, and use overlap only where the design allows the local thickness bump.
4. Write the layup sequence and debulk schedule into the book. Specify which plies are laid before each intermediate debulk, the orientation check points, and any ply that must be inspected before it is covered. The sequence must match the cure process (OOA needs more frequent debulk than autoclave).
5. Include the first-article verification plan. Call out which ply boundaries and orientations get a documented inspection, and capture as-built deviations (ply gaps, overlaps, orientation errors) against disposition limits so the ply book doubles as the build record for the structure.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
