# 3D Power Delivery Design

Design the power delivery network for a 3D stack where power must reach upper tiers through TSVs.

## Inputs

- `3d-thermal-analysis`: Thermal constraints on power density per tier
- `tsv-specification`: TSV parameters for power delivery

## Outputs

- `power-delivery-plan`: Power TSV count and placement, per-tier voltage regulation strategy, and IR drop analysis
- `decoupling-strategy`: Decoupling capacitor placement per tier and target PDN impedance

## Process

1. Calculate power TSV count per supply domain. Each TSV carries I = V_drop_per_TSV / R_TSV. For a 5um diameter, 50um long Cu TSV, R ~ 20 mohm. At 1mV drop budget per TSV, each carries ~50mA. For 10A supply, need 200 power TSVs minimum.
2. Distribute power TSVs across the die area. Concentrated TSVs create local current crowding in the BEOL. Spread them in a grid pattern aligned with on-die power grid.
3. Analyze IR drop through the full stack: package bump, substrate via, C4 bump, bottom die BEOL, power TSV, top die BEOL. Simulate with extracted PDN model.
4. Design per-tier decoupling. MIM (metal-insulator-metal) capacitors on the interposer or within the BEOL stack provide high-density decoupling (~200 nF/mm2 for deep-trench capacitors). Place close to high-transient-current blocks.
5. Consider per-tier or in-package voltage regulation (integrated voltage regulators) to reduce sensitivity to TSV resistance and improve transient response for the top tier.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
