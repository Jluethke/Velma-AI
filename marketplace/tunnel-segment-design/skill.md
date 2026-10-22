# Tunnel Segment Design

Design precast concrete tunnel lining segments: geometry, reinforcement, gaskets, and connection system.

## Inputs

- `tbm-specification`: TBM type, diameter, thrust capacity
- `ground-model`: Ground conditions along alignment including worst-case loading

## Outputs

- `segment-design`: Segment geometry (width, thickness, taper), reinforcement layout, gasket specification, bolt/dowel connections, and production tolerances
- `segment-structural-checks`: Structural verification for all load cases: ground loading, TBM thrust, handling, stacking, grouting pressure

## Process

1. Set ring geometry. Segment thickness from empirical rule: inner radius divided by 10 to 12, refined by structural analysis. Ring width typically 1.2 to 2.0 m (wider rings mean fewer joints but heavier segments; crane capacity and logistics constrain the choice). Typical ring: 5 segments plus key, or 6 plus key. Taper the ring for curve negotiation: taper equals ring width times sin(minimum curve angle per ring).
2. Determine design loads. Ground loading from analytical methods (Curtis-Muir Wood, Duddeck-Erdmann) or numerical analysis (2D FEM with beam-spring or continuum model). Include surcharge, adjacent structures, future development loads. Hydrostatic pressure at maximum groundwater level. TBM thrust jack forces on segment face (check local crushing at shoe pads). Grouting pressure behind segments (typically 1 to 3 bar above groundwater).
3. Design reinforcement. Primary reinforcement for bending moment and normal force from ground loading (interaction diagram). Splitting reinforcement at thrust jack locations (bursting forces from concentrated load). Edge reinforcement at gasket groove. Consider steel fiber reinforced concrete as alternative to rebar for standard segments (50 to 60 kg/m3 steel fibers, verify post-crack ductility).
4. Specify gasket system. EPDM gasket in groove near extrados face. Gasket design must maintain watertight seal at maximum gap and offset from construction tolerances. Gap from ring build accuracy and ground movement. Offset from ring roll and TBM steering. Gasket cross-section sized so compressed gasket contact stress exceeds water pressure at maximum gap and offset combination.
5. Design connection system. Bolts (straight or curved) or dowels between segments within a ring for handling and initial ring build. Dowel pins between rings to prevent ring roll during TBM advance. Guide rods to assist segment erection. Bolt pockets must not interfere with gasket groove or reinforcement. Specify hand-tightening torque for bolts to avoid over-compression of gasket.
6. Define production tolerances. Segment mold precision: length and width +/- 0.5 mm, thickness +/- 1 mm, gasket groove position +/- 0.5 mm. Concrete: f'c typically 50 to 60 MPa at 28 days, stripping strength at 8 to 12 hours. Curing regime for durability (steam cure or wet cure). Acceptance testing: dimensional check every segment, strength testing per batch.
7. Check handling and stacking loads. Segments must resist vacuum lifter handling forces and stacking loads during storage (typically 5 rings high). These transient load cases often govern reinforcement at segment edges.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
