# Performance Based Seismic Design

Evaluate structural performance against multiple hazard levels using ASCE 41 or equivalent for existing or high-importance structures.

## Inputs

- `seismic-detailing`: As-designed or as-built structural details
- `ground-motion-parameters`: Ground motions for multiple hazard levels (serviceability, design, MCE)

## Outputs

- `performance-assessment`: Structural performance level achieved at each hazard level (IO, LS, CP) with component-level acceptance checks
- `retrofit-recommendations`: If existing structure: identified deficiencies and recommended retrofit measures

## Process

1. Define performance objectives. ASCE 41 basic performance objective for existing buildings (BPOE): Life Safety at BSE-1E (225-year), Collapse Prevention at BSE-2E (975-year). For new buildings seeking enhanced performance: Immediate Occupancy at design earthquake, or Operational at serviceability earthquake.
2. Classify components as deformation-controlled or force-controlled. Deformation-controlled: members that can sustain inelastic deformation (beams in flexure, brace in tension). Force-controlled: brittle failure modes (shear in columns, connection fracture). For deformation-controlled: compare demand to m-factor modified capacity (linear) or to plastic rotation limits (nonlinear). For force-controlled: compare demand to lower-bound capacity with QUF <= phi*QCL.
3. Linear analysis: static or dynamic. Calculate demand-to-capacity ratios (DCR). For deformation-controlled: DCR = QUD / (m * QCE * kappa). If DCR > 1.0, the element does not meet the performance level. The m-factor depends on element type, detail category, and performance level (from ASCE 41 tables). For force-controlled: QUF = QG + QE/(C1*C2*J).
4. Nonlinear analysis: pushover (static) or response history (dynamic). Pushover: apply lateral forces proportional to first mode shape, push to target displacement (ASCE 41 coefficient method: delta_t = C0*C1*C2*Sa*Te^2/(4*pi^2)). Plot base shear vs. roof displacement. Check plastic rotation at each hinge against acceptance criteria. Response history: more accurate for irregular structures or when higher modes are significant.
5. For existing buildings requiring retrofit: identify deficiencies (columns with insufficient confinement, inadequate connections, soft stories, torsion). Select retrofit measures: FRP wrapping for column confinement, steel jacketing, addition of shear walls or braced frames, base isolation for entire building, supplemental damping (viscous dampers, friction dampers). Re-analyze retrofitted structure to verify performance objectives are met.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
