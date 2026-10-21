# Xrd Phase Matcher

Match observed peaks against crystallographic reference databases to identify phases.

## Inputs

- `peak-list`: Table of peak positions, intensities, and FWHM values
- `candidate-phases`: Optional list of expected phases to prioritize in the search

## Outputs

- `phase-identification`: Matched phases with confidence scores and reference card numbers
- `unmatched-peaks`: Peaks not assigned to any identified phase

## Process

1. Search the reference database (ICDD PDF, COD, or AMCSD) by peak position and relative intensity
2. Rank candidate phases by figure-of-merit score
3. Assign each observed peak to the best matching phase
4. Flag unmatched peaks for further investigation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
