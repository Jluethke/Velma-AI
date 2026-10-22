# Blanket Structural And Thermal Design

Design the blanket module structure and cooling system to extract nuclear heating while maintaining structural integrity under irradiation.

## Inputs

- `damage-assessment`: DPA rates and gas production
- `activation-analysis`: Activation levels
- `lifetime-estimate`: Replacement interval

## Outputs

- `blanket-module-design`: Module geometry, coolant channels, structural layout
- `thermal-performance`: Temperature distribution, coolant outlet conditions, power extraction
- `structural-integrity-assessment`: Stress analysis with irradiation effects included

## Process

1. Select structural material: RAFM steel (Eurofer-97) for near-term (T_max ~550C), SiC/SiC composite for advanced concepts (T_max ~1000C, enabling higher thermal efficiency), vanadium alloy (V-4Cr-4Ti) with liquid lithium coolant.
2. Design coolant channels: helium at 8 MPa (inlet 300C, outlet 500C for steel blanket) requires small channel diameter (10-15mm) for adequate heat transfer coefficient. PbLi as coolant faces MHD pressure drop: B^2 * sigma * v * L can exceed 1 MPa per meter in 5T field without SiC inserts.
3. Perform thermal analysis: volumetric nuclear heating peaks at ~40 W/cm3 near the first wall (14.1 MeV neutrons), decreasing exponentially into the blanket. Ensure peak structure temperature stays within material limits including irradiation-induced property changes.
4. Structural analysis: primary stress from coolant pressure, secondary stress from thermal gradients, cyclic fatigue from plasma transients (ELMs, disruptions). Apply RCC-MRx or SDC-IC design rules with irradiated material properties (reduced ductility, swelling, creep).
5. Design for remote maintenance: modular blanket segments (~2-4 tonnes each) with standardized coolant connections. Alignment features for remote handling. In-vessel inspection capability. Maintenance time budget drives plant availability.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
