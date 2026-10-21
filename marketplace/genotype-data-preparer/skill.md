# Genotype Data Preparer

Prepare and quality-filter genotype data for population genetic analysis.

## Inputs

- `raw-genotypes`: Genotype calls from SNP array, sequencing, or microsatellites
- `sample-metadata`: Population labels, sampling locations, and sample quality metrics

## Outputs

- `filtered-genotypes`: QC-passed genotype matrix with individuals and loci retained
- `qc-summary`: Missingness rates, call rates, and samples or loci removed

## Process

1. Filter individuals with excessive missing data (above threshold)
2. Filter loci with low call rate or extreme deviation from Hardy-Weinberg across all populations
3. Check for and remove related individuals using identity-by-descent estimates
4. Report the final dataset dimensions and any concerns

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
