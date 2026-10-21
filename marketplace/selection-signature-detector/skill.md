# Selection Signature Detector

Scan for signatures of natural selection in the genome.

## Inputs

- `filtered-genotypes`: Genotype data
- `differentiation-metrics`: Fst values across the genome

## Outputs

- `selection-candidates`: Genomic regions with outlier Fst, extended haplotype homozygosity, or other selection signals
- `selection-scan-summary`: Methods used, significance thresholds, and number of candidates

## Process

1. Scan for Fst outliers across the genome (top 1% or empirical p-value)
2. Compute extended haplotype homozygosity (EHH/iHS) for recent positive selection if phased data available
3. Cross-reference outlier regions with annotated genes
4. Report candidate regions with their gene content and functional annotations

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
