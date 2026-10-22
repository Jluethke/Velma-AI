# Bridge Structural Analysis

Perform structural analysis of the selected bridge type for all load combinations per AASHTO LRFD or applicable code.

## Inputs

- `selected-bridge-type`: Bridge type, span arrangement, and section properties
- `crossing-requirements`: Design loading (HL-93 or other), lane configuration

## Outputs

- `member-forces`: Enveloped moment, shear, and axial force at all critical sections for Strength, Service, and Fatigue limit states
- `live-load-distribution`: Distribution factors for moment and shear by girder, or results of refined analysis

## Process

1. Model the structure. For typical girder bridges: line girder analysis with AASHTO LRFD distribution factors (Table 4.6.2.2). For curved, skewed (> 20 degrees), or unusual bridges: grillage or 3D FEM with shell/beam elements. For cable-stayed: staged construction analysis tracking cable forces as deck extends.
2. Apply HL-93 loading: design truck (72 kip, 32/32/8 kip axles at 14/14-30 ft spacing) combined with design lane load (0.64 kip/ft). Or design tandem (50 kip, two 25-kip axles at 4 ft) combined with lane load. Use whichever produces larger effect. For negative moment and pier reactions, apply 90% of two trucks plus 90% of lane load in same span.
3. Calculate live load distribution factors. For moment in interior girders: g = 0.06 + (S/14)^0.4 * (S/L)^0.3 * (Kg/(12*L*ts^3))^0.1 (AASHTO approximate, in US customary units). For exterior girders: lever rule or special cases. Verify against refined analysis for non-standard configurations.
4. Generate force envelopes. Move the live load across the bridge to find the maximum and minimum force at each section. Combine with dead load (DC: structural components; DW: wearing surface, utilities) using load factors: Strength I: 1.25DC + 1.50DW + 1.75(LL+IM), where IM = 33% dynamic load allowance.
5. Check Service and Fatigue limit states. Service I: 1.0(DC+DW) + 1.0(LL+IM) for concrete stress limits. Service III: 1.0DC + 1.0DW + 0.8(LL+IM) for tension in prestressed concrete. Fatigue I: 1.75 times single design truck at 30 ft fixed axle spacing for infinite fatigue life check.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
