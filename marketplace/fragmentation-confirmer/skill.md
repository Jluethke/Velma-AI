# Fragmentation Confirmer

Confirm identifications using MS/MS fragmentation patterns.

## Inputs

- `candidate-matches`: Ranked candidate identifications
- `raw-spectrum`: MS/MS spectra for the precursor ions

## Outputs

- `confirmed-identifications`: Compounds confirmed by fragmentation match with confidence level
- `fragment-annotations`: Annotated fragment ions with proposed structures

## Process

1. Extract the MS/MS spectrum for each candidate precursor ion
2. Match observed fragments against the predicted fragmentation pattern
3. Score the match using a mirror plot comparison and fragment coverage
4. Assign a confidence level (1: standard match, 2: spectral library, 3: informatic prediction)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
