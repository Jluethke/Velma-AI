# Rigor Weighting Engine

Assign quality weights to each evidence source based on methodological rigor, using a transparent rubric.

## Inputs

- `evidence-inventory`: cataloged sources with design features

## Outputs

- `weighted-evidence-table`: each source with its quality weight and the rubric scores behind it
- `weighting-rubric`: the scoring rubric used, with criteria and thresholds

## Process

1. Define the weighting rubric: criteria (internal validity, external validity, precision, replicability), score range, and tier thresholds
2. Score each source on each criterion
3. Compute the composite weight as the product or weighted sum of criterion scores
4. Flag sources below the minimum quality threshold for sensitivity exclusion

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
