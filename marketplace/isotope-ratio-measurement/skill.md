# Isotope Ratio Measurement

Measure stable isotope ratios (delta-13C, delta-15N, and optionally delta-2H, delta-34S) by mass spectrometry.

## Inputs

- `tissue-samples`: Prepared sample capsules
- `baseline-samples`: Baseline organism capsules

## Outputs

- `isotope-values`: Delta values for each sample with analytical precision (from replicate standards)
- `quality-control`: Standard reference material results showing accuracy and precision of the run

## Process

1. Combust samples in the elemental analyzer coupled to the isotope ratio mass spectrometer
2. Measure delta-13C and delta-15N for all samples with interspersed reference standards
3. Correct raw delta values to the international scale using two-point normalization
4. Assess precision from replicate standards and flag any outlier measurements

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
