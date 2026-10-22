# Gating And Risering Design

Design the gating system for mold filling and the risering system for feeding solidification shrinkage, using analytical methods and solidification principles.

## Inputs

- `selected-casting-process`: Process type and mold material
- `part-geometry`: Casting geometry with section thicknesses and thermal centers identified

## Outputs

- `gating-system`: Pouring basin, sprue, runner, and ingate design with dimensions calculated from fill time and flow rate requirements
- `riser-design`: Riser locations, dimensions (diameter, height), and necking calculated from the solidification modulus method to ensure directional solidification toward the risers

## Process

1. Calculate the required fill time. For steel castings: t = K * sqrt(W) where K is an empirical constant (1.0-1.5 for thin sections, 1.5-2.5 for thick) and W is the casting weight in kg. For aluminum: similar approach with adjustments for the lower pouring temperature. The fill time must be short enough to prevent premature solidification of thin sections but slow enough to avoid turbulence and mold erosion.
2. Design the gating system from top to bottom using Bernoulli's equation. The sprue is tapered to prevent aspiration (top area / bottom area = sqrt(H_bottom / H_top) where H is the head of metal). The runner system distributes metal to the ingates. Use a pressurized system (sprue:runner:ingate ratio of 1:0.8:0.6) for ferrous metals to minimize turbulence, or an unpressurized system (1:1.1:1.2) for aluminum to minimize velocity and oxide entrainment.
3. Identify the thermal centers (locations that solidify last) using the solidification modulus method. The modulus M = V/A (volume / cooling surface area) for each section of the casting. The thermal center of each section is the location with the highest modulus. Shrinkage porosity forms at the thermal center unless it is fed by a riser with a higher modulus.
4. Size the risers so that each riser solidifies after the section it feeds. The riser modulus must be at least 1.2x the modulus of the fed section (Mr > 1.2 * Mc). Use Chvorinov's rule: solidification time is proportional to M^2. For cylindrical risers: the optimum height-to-diameter ratio is approximately 1.5. Add exothermic or insulating sleeves to increase the riser modulus without increasing the riser volume. The feeding distance (maximum distance a riser can feed) depends on the alloy and the section geometry (longer feeding distance for alloys with a narrow freezing range).
5. Add chills (external or internal) to accelerate solidification at locations where the natural solidification direction does not progress toward a riser. Chills increase the effective cooling rate locally, reducing the local modulus and directing the solidification front toward the riser.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
