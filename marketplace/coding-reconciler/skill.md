# Coding Reconciler

Reconcile coding inconsistencies: standardize categorical labels, fix date formats, unify measurement units, and validate against the codebook.

## Inputs

- `treated-dataset`: dataset after outlier treatment
- `codebook`: expected labels, formats, and units

## Outputs

- `reconciled-dataset`: dataset with standardized codes, dates, and units
- `reconciliation-log`: every recoding applied with before and after values

## Process

1. Identify variant spellings, case differences, and trailing whitespace in categorical fields
2. Map all variants to canonical labels from the codebook
3. Parse and standardize date fields into a single ISO format
4. Convert measurement units to a single standard per variable and log every conversion

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
