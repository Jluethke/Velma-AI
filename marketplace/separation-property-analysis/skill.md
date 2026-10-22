# Separation Property Analysis

Analyze the mixture properties to identify which separation methods are feasible.

## Inputs

- `mixture-composition`: Components, concentrations, and physical properties
- `separation-targets`: Purity and recovery requirements for each product

## Outputs

- `feasible-methods`: Ranked list of feasible separation methods with property basis
- `separation-difficulty`: Quantified difficulty for each method (relative volatility, selectivity, rejection)

## Process

1. Map the property differences between components to separate: boiling point (distillation), solubility (extraction, crystallization), molecular size (membrane), vapor pressure (evaporation), charge (ion exchange), affinity (adsorption, chromatography).
2. For each feasible method, quantify the separation factor: relative volatility alpha for distillation, partition coefficient K for extraction, rejection R for membranes, separation factor alpha for adsorption. Higher factors mean easier separation.
3. Screen out methods where the separation factor is too close to 1.0: alpha less than 1.05 for distillation is impractical, K less than 2 for extraction requires too many stages, R less than 0.9 for membranes gives poor purity in a single pass.
4. Consider hybrid separations when no single method works well: reactive distillation when reaction equilibrium limits conversion, membrane-distillation hybrid when an azeotrope exists, extraction followed by distillation for heat-sensitive materials.
5. Rank the feasible methods by estimated total cost (capital + operating). Distillation is usually cheapest when relative volatility exceeds 1.5 and the mixture is thermally stable. Membranes win for dilute aqueous solutions. Extraction wins for heat-sensitive or high-boiling mixtures.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
