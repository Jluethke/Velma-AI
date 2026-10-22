# Metal Am Post Processing

Convert the as-built part to a usable part: stress relief on the plate, part removal, hot isostatic pressing, heat treat, support removal, and finish machining in the right order.

## Inputs

- `build-file`: The completed build definition identifying which parts and coupons came off this plate
- `process-record`: The frozen parameters and material record for traceability through post-processing

## Outputs

- `finished-part`: The post-processed part at final dimensions with recorded heat treat, hot isostatic pressing, and machining operations
- `property-state`: The resulting material condition: density, microstructure, and heat-treat temper, mapped to the expected mechanical properties

## Process

1. Stress-relieve before cutting the part off the plate. A sub-transus stress-relief cycle (for Ti-6Al-4V, around 600 to 800 C) while the part is still fixed to the plate prevents the spring-back warping that happens when built-in residual stress releases on removal. Only then wire-EDM or bandsaw the part from the plate.
2. Hot isostatic press (HIP) when fatigue or fracture duty requires it. HIP (for titanium, around 900 to 950 C at 100 to 150 MPa for 2 to 4 hours) closes internal gas porosity and lack-of-fusion voids, which can lift fatigue life several-fold. Note that HIP can coarsen microstructure, so the subsequent heat treat is chosen with HIP in mind.
3. Apply the solution and aging heat treat to reach the specified temper. The as-built microstructure is not the final one; IN718 needs solution plus double-age, Ti-6Al-4V may be annealed or solution-treated-and-aged depending on the property target. Sequence HIP, solution, and age per the material spec so each step lands the intended phase and grain structure.
4. Remove supports and finish surfaces in a controlled order. Grind or machine off supports, then machine datum and functional surfaces using the machining stock left during design. Do the metrology-defining cuts last, after all thermal operations, so heat-treat distortion does not move finished features.
5. Improve fatigue-critical surfaces deliberately. As-built and support-contact surfaces are rough stress risers; shot peen, machine, or polish the fatigue-driving surfaces. Plan the datum scheme so the part can be located and machined after it has distorted from the nominal build shape.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
