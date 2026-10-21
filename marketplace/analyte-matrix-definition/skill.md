# Analyte Matrix Definition

Define the target analytes and the sample matrix they sit in.

## Inputs

- `sample-description`: Description of the sample and its origin
- `target-analytes`: List of compounds to separate and quantify
- `required-sensitivity`: Detection limits needed for each analyte

## Outputs

- `analyte-profile`: Physicochemical properties of each analyte (pKa, logP, MW)
- `matrix-characterization`: Matrix components that may interfere with separation
- `method-requirements`: Performance criteria the method must meet

## Process

1. List all target analytes with their molecular weights, pKa values, and partition coefficients
2. Characterize the sample matrix for potential interferents (salts, proteins, lipids)
3. Define the required sensitivity, resolution, and throughput for the final method
4. Identify any regulatory or pharmacopeial requirements that apply

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
