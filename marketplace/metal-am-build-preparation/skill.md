# Metal Am Build Preparation

Prepare the build: slicing, scan strategy, parameter set, powder control, and atmosphere, so the as-built microstructure and density meet the part duty.

## Inputs

- `am-ready-geometry`: The additive-ready geometry with fixed orientation
- `support-strategy`: The support plan for the oriented part

## Outputs

- `build-file`: The sliced build with scan paths, parameter assignments per region, and support toolpaths ready for the machine
- `process-record`: The frozen parameter set, powder lot and recycle count, chamber atmosphere target, and witness-coupon plan for this build

## Process

1. Lock the qualified parameter set rather than tuning per build. Each alloy and machine has a developed parameter window: laser power (typically 150 to 400 W for powder bed), scan speed (700 to 1400 mm/s), hatch spacing (0.08 to 0.14 mm), and layer thickness (30 to 60 um), giving volumetric energy density around 40 to 80 J/mm3. Changing any one of these invalidates prior qualification data.
2. Set the scan strategy for stress and density. Use a stripe or checkerboard scan with layer-to-layer rotation (commonly 67 degrees) to break up columnar grain alignment and distribute residual stress. Assign contour plus infill parameters separately so the skin gets surface finish and the core gets density.
3. Control the powder. Record lot, particle size distribution (typically 15 to 45 um for laser powder bed, 45 to 106 um for EBM), and recycle count; sieve and blend per the powder management plan. Reactive alloys (titanium, aluminum) demand tight oxygen and moisture control because recycled powder picks up oxygen each cycle and shifts mechanical properties.
4. Set and verify the atmosphere. Laser powder bed runs under argon or nitrogen with chamber oxygen held below about 0.1% (1000 ppm), often below 100 ppm for titanium; EBM runs under vacuum. Verify the oxygen sensor reading before the build starts, not just the setpoint.
5. Add witness coupons to the build plate in representative orientations. Tensile bars, density cubes, and a microstructure coupon printed alongside the part, in the same orientations as the part's critical features, are the evidence that this specific build met properties. Plan their locations and their post-processing to match the part.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
