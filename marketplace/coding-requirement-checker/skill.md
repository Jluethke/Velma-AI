# Coding Requirement Checker

Check documentation against ICD-10 and CPT coding requirements.

## Inputs

- `clinical-notes`: Provider's clinical documentation
- `assigned-codes`: ICD-10 and CPT codes assigned to the encounter

## Outputs

- `coding-gaps`: Codes lacking sufficient documentation support
- `supported-codes`: Codes with adequate clinical evidence

## Process

1. Map each assigned code to its documentation requirements.
2. Check that the clinical notes contain the required elements.
3. Flag codes that lack specificity or supporting detail.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
