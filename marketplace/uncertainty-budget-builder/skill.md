# Uncertainty Budget Builder

Build a complete uncertainty budget: identify every error source (statistical, systematic, environmental), estimate each contribution, and propagate to the final result.

## Inputs

- `governing-equations`: How measured quantities combine into the result
- `sensor-specifications`: Instrument accuracy, resolution, and drift
- `critical-dimensions`: Geometric tolerances

## Outputs

- `uncertainty-budget`: Table of error sources, type (A or B), magnitude, and contribution to combined uncertainty
- `dominant-error-sources`: Ranked list of the largest contributors to total uncertainty
- `combined-uncertainty`: Propagated combined standard uncertainty and expanded uncertainty

## Process

1. List every source of uncertainty (sensor, alignment, environment, model)
2. Classify each as Type A (statistical) or Type B (systematic)
3. Estimate the magnitude of each contribution
4. Propagate through the governing equations to the final combined uncertainty
5. Identify the dominant sources and whether they can be reduced

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
