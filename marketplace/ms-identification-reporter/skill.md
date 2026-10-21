# Ms Identification Reporter

Compile the identification results into a structured report.

## Inputs

- `confirmed-identifications`: Confirmed compound identifications with confidence levels
- `fragment-annotations`: Annotated fragmentation data
- `mass-accuracy-report`: Calibration and mass accuracy data

## Outputs

- `identification-report`: Final report listing identified compounds, evidence level, and spectra
- `unidentified-features`: Masses that could not be identified, with partial structural information if available

## Process

1. Compile all confirmed identifications with their supporting evidence
2. List unidentified masses with any partial structural information (molecular formula, substructure)
3. Include annotated spectra for each confirmed compound
4. State the confidence level and limitations for each identification

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
