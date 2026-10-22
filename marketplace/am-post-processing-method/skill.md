# Am Post Processing Method

Define the post-processing sequence for the AM part including stress relief, HIP, heat treatment, support removal, and finish machining to meet final part specifications.

## Inputs

- `validated-parameters`: Build parameters and as-built material condition
- `optimized-geometry`: Part geometry with support locations and machining stock

## Outputs

- `post-processing-sequence`: Ordered sequence of post-processing operations with parameters (temperatures, pressures, durations) and intermediate inspection points
- `final-material-properties`: Expected mechanical properties after post-processing (UTS, YS, elongation, fatigue, fracture toughness) with reference to test coupon data

## Process

1. Stress relief on the build plate before removal. For Ti-6Al-4V: 650-670C for 2-3 hours in vacuum or inert atmosphere. For IN718: solution anneal at 1065C for 1 hour followed by precipitation aging. Removing the part from the build plate before stress relief risks distortion and cracking.
2. Hot isostatic pressing (HIP) to close internal porosity. For Ti-6Al-4V: 920C / 100 MPa / 2 hours in argon. HIP closes lack-of-fusion and gas porosity below about 50 microns but cannot close surface-connected pores (verify by CT scan before HIP if surface porosity is a concern). HIP typically improves fatigue life by 2-10x by eliminating internal crack initiation sites.
3. Heat treatment for target microstructure. For Ti-6Al-4V after HIP: the HIP cycle may serve as the annealing treatment if the temperature is above the beta transus (sub-transus for a fine alpha+beta microstructure, super-transus for a lamellar colony structure with higher fracture toughness but lower fatigue strength). For IN718: double aging (720C/8hr + 620C/8hr) after solution treatment for gamma-prime and gamma-double-prime precipitation.
4. Support removal and surface finishing. Wire EDM or band saw for build plate separation. Hand tools, CNC machining, or chemical etching for support removal. Machining of critical surfaces to final dimensions. Shot peening or laser shock peening for fatigue-critical surfaces (introduces compressive residual stress). Surface roughness of as-built SLM parts is typically Ra 5-15 microns; machining brings this to Ra 0.8-3.2 microns.
5. Final inspection. Dimensional measurement (CMM or 3D scanning). CT scanning for internal defect detection (resolution depends on part size and wall thickness; typical minimum detectable defect 50-200 microns). Witness coupon testing for mechanical properties (coupons built alongside the part in the same build, subjected to the same post-processing).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
