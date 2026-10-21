# Spectral Database Searcher

Search spectral databases for candidate compound identifications.

## Inputs

- `deconvoluted-masses`: Neutral molecular masses to identify
- `acquisition-metadata`: Ionization method and instrument type for database filtering

## Outputs

- `candidate-matches`: Ranked list of candidate compounds with scores and molecular formulas
- `search-parameters`: Database, mass tolerance, and filters used

## Process

1. Query spectral databases (NIST, MassBank, METLIN, mzCloud) within the mass tolerance
2. Score matches by isotope pattern fit, retention time prediction, and spectral similarity
3. Filter candidates by ionization mode compatibility and source organism if known
4. Rank candidates by composite score

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
