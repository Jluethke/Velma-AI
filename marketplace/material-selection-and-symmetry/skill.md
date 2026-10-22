# Material Selection And Symmetry

Select laminate materials for the target Dk/Df at operating frequency, and ensure the stackup is symmetric about the center for warp control.

## Inputs

- `layer-assignment-table`: Layer functions and signal speeds
- `signal-classes`: Frequencies and loss budgets for material selection
- `minimum-layer-count`: Layer count for symmetry planning

## Outputs

- `material-selection`: Laminate and prepreg materials for each dielectric layer, with Dk and Df at the operating frequency
- `symmetry-verification`: Stackup cross-section showing symmetry about the center line: matching copper weights, dielectric thicknesses, and materials above and below center
- `glass-weave-specification`: Glass style selection for each prepreg layer to control Dk uniformity and avoid fiber weave effect

## Process

1. Select laminate based on loss requirements: standard FR-4 (Dk ~ 4.2, Df ~ 0.02 at 1 GHz) works for signals up to about 5 Gbps. Mid-loss materials like Megtron 4 (Dk ~ 3.8, Df ~ 0.008) support 10 to 16 Gbps. Low-loss materials like Megtron 6 (Dk ~ 3.6, Df ~ 0.004) or Rogers (Dk ~ 3.5, Df ~ 0.003) are needed above 16 Gbps. The rule: if insertion loss at Nyquist exceeds 0.5 dB/inch on FR-4, move to a lower-loss material.
2. Ensure stackup symmetry: the layers above the center must mirror the layers below in copper weight, dielectric thickness, and material type. An asymmetric stackup warps during lamination because the different materials have different coefficients of thermal expansion. Warp causes assembly problems (components do not sit flat) and can cause BGA solder joint failures.
3. Select glass weave style: the glass fibers in prepreg have Dk ~ 6.2 while the resin has Dk ~ 3.1. Where a trace runs over glass vs resin, it sees different Dk, causing impedance variation (the fiber weave effect). For signals above 10 Gbps, specify spread-glass or flat-glass prepreg (e.g., 1078, 2116 with spread weave) to reduce this variation. Alternatively, route traces at an angle to the weave direction.
4. Specify resin content: higher resin content lowers the effective Dk (more resin, less glass) but also reduces mechanical strength. The fabricator controls resin content by selecting glass style and pressing conditions. Work with the fabricator to choose a glass/resin combination that hits your Dk target while maintaining structural integrity.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
