# Annotation Quality Controller

Set up quality control with inter-annotator agreement and gold checks.

## Inputs

- `calibration-set`: Gold standard examples
- `annotation-schema`: Label taxonomy

## Outputs

- `qc-protocol`: Quality control procedures and thresholds
- `agreement-metrics`: Inter-annotator agreement baseline (Cohen kappa, Fleiss kappa)

## Process

1. Define the overlap rate for double annotation.
2. Set the inter-annotator agreement threshold.
3. Insert gold standard items at regular intervals.
4. Define the adjudication process for disagreements.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
