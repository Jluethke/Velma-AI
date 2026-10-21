# Isotope Labeling Tester

Design and interpret isotope labeling experiments to test proposed mechanistic pathways.

## Inputs

- `proposed-mechanism`: Candidate mechanistic steps to be tested
- `available-labels`: Isotopes available: deuterium, 13C, 15N, 18O

## Outputs

- `labeling-predictions`: Where each label should appear in products for each candidate mechanism
- `experimental-results`: Observed label distribution in products compared to predictions

## Process

1. For each candidate mechanism, trace where the isotopic label would end up in products
2. Design the labeling experiment to distinguish between competing pathways
3. Analyze the labeled products by mass spectrometry or NMR to determine label position
4. Compare observed labeling pattern against predictions to rule out or support each pathway

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
