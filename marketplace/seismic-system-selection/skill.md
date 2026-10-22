# Seismic System Selection

Select the lateral force-resisting system and configure the structure for seismic performance.

## Inputs

- `design-spectrum`: Site-specific design spectrum and seismic design category
- `structural-layout`: Building plan dimensions, height, occupancy, and architectural constraints

## Outputs

- `lateral-system`: Selected LFRS type, R factor, redundancy factor, and system configuration
- `seismic-weight`: Effective seismic weight and mass distribution by floor

## Process

1. Select LFRS type based on SDC, height, and performance objectives. Steel special moment frames: high ductility (R=8), no height limit, flexible (large drifts, expensive connections). Steel special concentrically braced frames: moderate ductility (R=6), good stiffness, limited height in SDC D/E. Steel eccentrically braced frames: R=8, combines stiffness and ductility. Reinforced concrete special moment frames: R=8, no height limit. RC special shear walls: R=5-6, excellent stiffness, most economical for mid-rise. Dual systems: combine frame and walls for redundancy.
2. Configure the system in plan. Provide lateral resistance in both orthogonal directions. Minimize eccentricity between center of mass and center of rigidity to limit torsion. Irregularity checks: torsional irregularity if max drift > 1.2 times average drift. Soft story if stiffness < 70% of story above. Avoid re-entrant corners > 15% of plan dimension, or provide collector elements.
3. Configure vertically. Avoid soft stories (reduce stiffness discontinuity). Avoid weak stories (strength discontinuity). Weight irregularity if any story mass > 150% of adjacent story. Vertical geometric irregularity if lateral system dimension changes > 130%. These irregularities trigger more stringent analysis requirements.
4. Calculate seismic weight. Include full dead load plus applicable portion of live load (25% of floor live in storage and warehouse, 20% of flat roof snow > 30 psf, full weight of permanent equipment). Distribute to each floor. Calculate effective modal mass for each mode.
5. Check system compatibility with architectural requirements. Moment frame bay widths must align with architectural grid. Braced frame locations must avoid doorways and windows. Shear wall locations must be architecturally acceptable and have adequate foundations. Resolve conflicts before proceeding to analysis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
