# Tsv And Rdl Design

Design the through-silicon vias and redistribution layers for signal routing, power delivery, and ground distribution on the interposer.

## Inputs

- `interposer-technology`: Selected interposer technology and parameters
- `key-design-parameters`: TSV pitch, RDL line/space, interposer thickness

## Outputs

- `tsv-design`: TSV dimensions, pitch, keep-out zone, and process (via-middle or via-last)
- `rdl-stackup`: RDL layer count, metal thickness, dielectric, line/space rules, and routing plan

## Process

1. Size TSVs: diameter typically 5-10um, depth = interposer thickness (50-100um for thinned silicon), aspect ratio limited to 10:1 for via-middle process. Pitch 40-50um minimum for via-middle, wider for via-last.
2. Define keep-out zone around each TSV. Thermo-mechanical stress from CTE mismatch between copper fill and silicon creates a stress field. Keep-out radius typically 5-10x TSV diameter for sensitive analog circuits.
3. Design RDL stackup. Minimum 2 layers for simple redistribution, 4-6 layers for complex die-to-die routing. Bottom layers (coarse pitch) for power distribution, top layers (fine pitch) for signal routing.
4. Route die-to-die signals on top RDL layers. Calculate impedance for controlled-impedance lines (50 ohm single-ended, 85-100 ohm differential). Typical RDL dielectric (SiO2 or polymer, Er ~3-4) and metal (Cu, 1-3um thick).
5. Assign TSVs for power and ground. Calculate required TSV count from IR drop budget: each TSV has resistance ~50-200 mohm depending on dimensions. Total power TSV count = I_total * R_per_TSV / V_drop_budget.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
