# Viability Normalizer

Subtract blank, normalize signal to controls, and compute percent viability.

## Inputs

- `mapped-readings`: Signal values per well with condition labels
- `control-wells`: Positive and negative control signal values

## Outputs

- `percent-viability`: Viability as percentage of positive control per well
- `replicate-statistics`: Mean, standard deviation, and CV per concentration per compound

## Process

1. Subtract the mean blank (negative control) signal from all wells
2. Normalize each treated well to the mean positive control: viability = (treated - neg) / (pos - neg) x 100
3. Average replicates and compute standard deviation and coefficient of variation
4. Flag any concentration points with CV above 20% for review

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
