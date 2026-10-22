# 3D Tsv Design

Design through-silicon vias for vertical power delivery and signal routing in a 3D stack.

## Inputs

- `bonding-method`: Selected bonding technology
- `vertical-pitch`: Bond pitch and density

## Outputs

- `tsv-specification`: TSV diameter, depth, pitch, liner thickness, fill material, and process insertion point (via-first, via-middle, via-last)
- `tsv-keep-out`: Keep-out zone dimensions around each TSV and impact on available routing area

## Process

1. Select TSV process insertion point. Via-middle (after FEOL, before BEOL): diameter 4-8um, compatible with hybrid bonding and micro-bump. Via-last (after wafer thinning): diameter 10-50um, lower cost but larger area.
2. Size TSV diameter and depth. Aspect ratio limit ~10:1 for via-middle (electroplating fill limitation). For 50um thinned die, TSV diameter minimum ~5um. Liner: 100-200nm SiO2 isolation + 10-50nm TaN/Ta barrier + Cu fill.
3. Calculate TSV electrical parameters. Resistance: R = rho_Cu * L / (pi * r^2). Capacitance: C = 2*pi*epsilon*L / ln(r_outer/r_inner) for the oxide liner. Inductance: L_ind approximately mu_0 * length / (2*pi) * ln(pitch/radius).
4. Define keep-out zone. Thermo-mechanical stress from Cu-Si CTE mismatch (Cu ~17 ppm/C, Si ~2.6 ppm/C) creates tensile and compressive stress regions. Affects transistor mobility. Keep-out typically 5-15um radius from TSV center depending on sensitivity.
5. Allocate TSVs: power/ground TSVs sized from IR drop budget (target < 5-10mV drop per tier), signal TSVs for vertical data paths. Place power TSVs in a distributed grid pattern to minimize loop inductance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
