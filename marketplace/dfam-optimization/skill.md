# Dfam Optimization

Apply Design for Additive Manufacturing rules to optimize the part geometry for the selected process, including build orientation, support strategy, and lattice structures.

## Inputs

- `selected-process`: The AM process and machine platform to design for
- `geometry-description`: Current part geometry and functional requirements

## Outputs

- `optimized-geometry`: Modified geometry with DfAM features applied (self-supporting angles, lattice infill, optimized build orientation)
- `support-strategy`: Support structure locations, types (block, tree, conical), and removal method

## Process

1. Select build orientation. Balance: surface finish (down-skin is roughest, up-skin best, vertical walls intermediate), support volume (overhangs below 45 degrees need support in SLM), build height (taller builds take longer and accumulate more residual stress), critical dimension accuracy (best in-plane, worst in build direction due to staircase effect and thermal distortion).
2. Apply self-supporting design rules. Convert overhangs below 45 degrees to chamfers or fillets at 45 degrees. Replace horizontal holes with diamond or teardrop cross-sections (self-supporting above 8mm diameter). Add draft angles to internal channels. Minimum channel diameter for powder removal: 1-2mm for SLM (depends on powder size and channel length).
3. Design lattice structures for weight reduction. Use topology optimization to identify load paths, then replace low-stress regions with lattice infill (strut-based: BCC, FCC, octet-truss; or TPMS: gyroid, diamond, Schwarz-P). Size struts above 0.3mm for manufacturability. Grade the lattice density to match the stress distribution. Verify the lattice design by FEA with beam or solid element models.
4. Design for post-processing access. Leave machining stock (0.5-1mm) on critical surfaces. Ensure support structures are accessible for removal (no trapped supports in internal cavities). Add sacrificial features for fixturing during machining. Plan the build plate removal method (wire EDM, band saw).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
