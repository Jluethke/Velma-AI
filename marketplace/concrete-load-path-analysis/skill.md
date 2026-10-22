# Concrete Load Path Analysis

Determine the load path through a concrete structure and identify critical members and sections for design.

## Inputs

- `structural-layout`: Geometry, spans, supports, and intended load-carrying system
- `loading-requirements`: Dead, live, wind, seismic, thermal, and any special loads with applicable code

## Outputs

- `load-combinations`: Factored load combinations per applicable code (ACI 318, Eurocode 2) with controlling combinations identified
- `critical-sections`: Member forces (M, V, N, T) at critical sections for each controlling load combination

## Process

1. Trace the gravity load path from slab to beam to column to foundation. Identify the lateral system: moment frame, shear wall, or dual system. Verify load path continuity (no load path discontinuities that create transfer structures without explicit design).
2. Calculate tributary areas for gravity members. For two-way slabs, use yield line or equivalent frame method for load distribution to beams. For one-way slabs, tributary width to supporting beams.
3. Apply load factors per code. ACI 318: 1.2D + 1.6L, 1.2D + 1.0W + 1.0L, 0.9D + 1.0W, 1.2D + 1.0E + 1.0L. Eurocode: 1.35G + 1.5Q, 1.35G + 1.5Q + 0.6*1.5W. Generate all required combinations and identify which controls at each section.
4. Run structural analysis. For regular frames: moment distribution or stiffness method. For complex structures: FEM (plate elements for slabs, beam elements for frames). For seismic: modal response spectrum analysis or equivalent lateral force. Extract M, V, N at critical sections: face of support for moment, d from face for shear, mid-span for deflection.
5. Identify sections requiring special attention: transfer beams, coupling beams, deep beams (span/depth < 4), corbels, beam-column joints, regions with high shear or torsion.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
