# Sandwich And Joint Design

Design sandwich panel core selection and attachment joints for the composite structure, accounting for core shear, facesheet wrinkling, and bolted or bonded joint failure modes.

## Inputs

- `failure-envelope`: Laminate strength margins from the failure assessment
- `structural-loads`: Applied loads including out-of-plane pressure and panel stability requirements

## Outputs

- `sandwich-design`: Core type, density, and thickness selection with facesheet wrinkling and core shear margins
- `joint-design`: Joint configuration (bolted, bonded, or hybrid) with bearing/bypass interaction and adhesive peel/shear stress analysis

## Process

1. Select core type from loading environment. Nomex honeycomb for moderate temperature aerospace. Aluminum honeycomb for higher loads. Closed-cell foam (Rohacell, Divinycell) where water ingress is a concern. Core density drives shear strength: plot core shear stress (V/d) against core shear allowable for candidate densities.
2. Check facesheet wrinkling: sigma_wr = 0.5 * (Ef * Gc * Ec)^(1/3) where Ef is facesheet modulus, Gc is core shear modulus, Ec is core through-thickness modulus. The knockdown from this theoretical value to test is typically 0.5-0.65.
3. For bolted joints: calculate the bearing stress (P / (d * t)) and bypass stress from the load distribution. Plot on the bearing/bypass interaction diagram. The bolt pattern must be designed so that no fastener exceeds the interaction envelope. Minimum edge distance is typically 3D, pitch 4-5D.
4. For bonded joints: calculate the adhesive shear stress distribution using the Volkersen or Hart-Smith elastic-plastic model. The peak shear stress at the overlap ends must stay below the adhesive shear allowable. Peel stress at the ends of single-lap joints is the typical failure driver; use doublers or tapered adherends to reduce peel.
5. For primary structure, bonded joints require a positive NDI method for bond quality verification. If the bond cannot be inspected, design as if the bond carries zero load (fail-safe with mechanical fastener backup).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
