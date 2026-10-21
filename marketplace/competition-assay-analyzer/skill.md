# Competition Assay Analyzer

Analyze competition binding data to determine IC50 and compute Ki using the Cheng-Prusoff equation.

## Inputs

- `competition-data`: Specific binding of radiolabeled ligand vs concentration of competing compound
- `kd-values`: Kd of the radiolabeled ligand from saturation analysis

## Outputs

- `ic50-values`: IC50 for each competing compound with confidence interval
- `ki-values`: Ki computed from IC50 using the Cheng-Prusoff equation

## Process

1. Fit competition curves to the one-site competition model
2. Extract IC50 from each fitted curve with confidence intervals
3. Compute Ki = IC50 / (1 + [L]/Kd) using the Cheng-Prusoff equation
4. Rank competing compounds by Ki from highest to lowest affinity

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
