# Assay Quality Assessor

Assess assay quality using the Z-factor and control signal window.

## Inputs

- `control-wells`: Positive and negative control signal values
- `replicate-statistics`: Within-plate variability metrics

## Outputs

- `z-factor`: Z-factor score per plate indicating assay quality
- `quality-classification`: Pass (Z > 0.5), marginal (0 < Z < 0.5), or fail (Z < 0) per plate

## Process

1. Compute Z-factor from positive and negative control means and standard deviations
2. Classify each plate as excellent (Z > 0.5), acceptable (Z > 0), or failed
3. Check signal-to-background ratio and signal-to-noise ratio
4. Flag any plates that should be repeated due to poor assay performance

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
