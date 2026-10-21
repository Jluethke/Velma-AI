# Product Formation Analyzer

Analyze product formation kinetics: growth-associated, non-growth-associated, or mixed, and compute the volumetric and specific production rates.

## Inputs

- `time-course-data`: Product concentrations, biomass, and substrate vs. time
- `growth-parameters`: Growth rate for classifying production kinetics

## Outputs

- `production-kinetics`: Classification (growth-associated, non-growth-associated, or mixed) with Luedeking-Piret parameters
- `production-rates`: Volumetric productivity (g/L/h) and specific productivity (g/g/h) in each phase

## Process

1. Plot specific production rate (qp) vs. specific growth rate (mu).
2. Fit the Luedeking-Piret model: qp = alpha * mu + beta.
3. Classify: alpha-dominated is growth-associated, beta-dominated is non-growth-associated.
4. Compute volumetric productivity: total product / (volume * time) for the entire fermentation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
