# Gwas Phenotype Genotype Loader

Load and align phenotype and genotype datasets, verifying sample overlap and data formats.

## Inputs

- `genotype-files`: Genotype data in PLINK, VCF, or BGEN format
- `phenotype-file`: Phenotype and covariate data with sample identifiers

## Outputs

- `aligned-dataset`: Matched genotype-phenotype dataset ready for QC
- `sample-summary`: Sample count, phenotype distribution, and missing data rates

## Process

1. Read genotype and phenotype files and match on sample identifiers.
2. Report the number of overlapping samples and any ID mismatches.
3. Summarize the phenotype distribution (continuous: mean, SD; binary: case/control counts).
4. List available covariates (age, sex, principal components).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
