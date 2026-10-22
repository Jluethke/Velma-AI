# Metal Am Part Qualification

Qualify the part for structural use with density verification, witness-coupon mechanicals, microstructure review, and a dimensional and defect acceptance basis.

## Inputs

- `finished-part`: The post-processed part at final dimensions
- `property-state`: The material condition and expected properties from post-processing

## Outputs

- `qualification-evidence`: The density, mechanical, microstructure, and dimensional results with accept/reject calls against the acceptance basis
- `acceptance-basis`: The documented criteria future builds of this part are accepted against: coupon minimums, allowable porosity, and inspection scope

## Process

1. Verify density and internal integrity. Archimedes density gives a fast bulk check (target above 99.5%, often 99.9% after HIP); X-ray computed tomography (CT) finds and locates internal voids, lack-of-fusion, and trapped powder that bulk density misses. Set the allowable defect size and location against the part's stress field, not a blanket number.
2. Pull mechanical properties from the witness coupons in the part's build orientations. Report yield, ultimate, elongation, and where duty demands it, fatigue and fracture toughness, in both the Z (build) direction and in-plane, because additive metals are anisotropic. Compare to the material allowables used in the stress analysis, not to wrought handbook values.
3. Review microstructure on a sectioned coupon. Confirm the expected phase and grain structure, absence of unmelted powder and keyhole porosity, and that HIP and heat treat landed the intended condition. Microstructure explains why a coupon missed properties and whether the cause is parameter drift or powder.
4. Dimensionally inspect against the drawing with a first-article layout. Additive distortion and support-contact zones are the usual nonconformances; CT doubles as a dimensional tool for internal channels that no probe can reach.
5. Freeze the acceptance basis for recurring production. Record the coupon minimums, the allowable porosity map, the required inspections, and the frozen process from build preparation. A later build is accepted by repeating this evidence set, and any process change triggers a delta qualification rather than silent acceptance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
