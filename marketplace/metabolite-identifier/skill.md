# Metabolite Identifier

Identify metabolites by matching spectral features against reference databases and standards.

## Inputs

- `feature-table`: Detected features with m/z, retention time, and/or chemical shift
- `reference-databases`: HMDB, METLIN, MassBank, or in-house library

## Outputs

- `annotated-feature-table`: Features annotated with putative metabolite identifications and confidence levels
- `identification-evidence`: Matching scores, MS2 mirror plots, and confidence classification (MSI levels 1-4)

## Process

1. Match accurate mass and isotope pattern against databases (MSI level 3)
2. Compare MS2 fragmentation spectra against spectral libraries (MSI level 2)
3. Confirm with authentic standards where available (MSI level 1)
4. Annotate the feature table with the best identification and confidence level

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
