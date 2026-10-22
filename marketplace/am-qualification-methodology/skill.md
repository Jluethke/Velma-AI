# Am Qualification Methodology

Qualify the additive manufactured part through a structured test program that demonstrates equivalence to design requirements and establishes production controls.

## Inputs

- `post-processing-sequence`: Complete manufacturing sequence from build through post-processing
- `final-material-properties`: Expected properties from process development

## Outputs

- `qualification-evidence`: Test results demonstrating the part meets all design requirements with statistical basis values
- `production-control-plan`: Locked process specification, in-process controls, acceptance tests, and change management requirements for production

## Process

1. Build the test matrix per the applicable standard (NASA-STD-6030, MMPDS/CMH-17 additive, ASTM F3122, or customer-specific). Test at multiple orientations (XY, XZ, ZX as minimum) because AM properties are anisotropic. Include specimens from the bottom, middle, and top of the build volume to characterize spatial variation.
2. Generate statistical design allowables. A-basis (99% exceedance at 95% confidence) requires at least 75 specimens per condition for MMPDS. B-basis (90% exceedance at 95% confidence) requires 30+. If test data is limited, use tolerance limit factors (k-factors) appropriate to the sample size. Report: mean, standard deviation, coefficient of variation, and basis values for UTS, YS, elongation, fatigue life at specified stress levels, and fracture toughness.
3. Demonstrate equivalence between test coupons and actual part properties. Build instrumented parts with embedded witness coupons (coupons attached to the part or built in the same build at the same height). Destructive testing of sacrificial first articles. CT scanning of production parts to verify internal quality against the qualification CT baseline.
4. Lock the process specification. Document every parameter that affects the final part (machine model, software version, powder specification, reuse limits, build parameters, atmosphere, post-processing sequence). Any change to a locked parameter requires re-qualification or a substantiated engineering equivalence assessment. Define the production acceptance test plan: tensile test of witness coupons from every build, dimensional inspection, and NDI per the qualification-established methods.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
