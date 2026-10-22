# Gap And Inductance Verification

Calculate the air gap length for inductors, verify inductance under DC bias, and address fringing flux effects near the gap.

## Inputs

- `winding-specification`: Turns count, wire type, layer structure
- `winding-loss`: Copper loss budget for thermal verification

## Outputs

- `gap-specification`: Air gap length in mm, gap placement (center leg, distributed, or spacer), fringing flux correction factor
- `verified-inductance`: Inductance value verified under DC bias conditions, including saturation margin and temperature effects

## Process

1. Calculate required gap length: lg = mu0 * N^2 * Ae / L - le/mu_r. For ferrite (mu_r ~ 2000+), the le/mu_r term is small and the gap dominates: lg = mu0 * N^2 * Ae / L. Typical gaps are 0.1mm to 2mm for power inductors.
2. Apply fringing flux correction. The effective gap area is larger than the core area due to fringing: Ae_eff = Ae * (1 + lg/sqrt(Ae) * ln(2*h_window/lg)). This reduces the required gap by the correction factor. For gaps larger than 10% of the center leg diameter, fringing is significant and reduces inductance less than the simple formula predicts.
3. Verify inductance under DC bias. Ferrite permeability drops with DC bias (B-H curve saturation). At the peak current, calculate B_dc = mu0 * N * Ipk / (lg + le/mu_r). If B_dc exceeds 300mT for standard ferrite, the core saturates. Either increase the gap, use a larger core, or switch to a material with higher Bsat (e.g., 3C97 at 500mT).
4. For distributed gap (powdered iron, Kool Mu), there is no discrete air gap. The permeability roll-off curve from the datasheet gives the effective permeability at a given H (= N*I/le). Calculate inductance at peak current using the rolled-off permeability, not the initial value. Typical Kool Mu loses 50% of its initial permeability at 80-100 Oe.
5. Document final gap specification: gap length, gap placement (center leg only, or split between center and outer legs for reduced fringing EMI), and spacer material. For EE cores, specify whether the gap is ground into the center post or uses a Mylar spacer between core halves.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
