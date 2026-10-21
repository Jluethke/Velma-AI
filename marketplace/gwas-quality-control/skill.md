# Gwas Quality Control

Filter samples and variants that fail quality thresholds before association testing.

## Inputs

- `aligned-dataset`: Matched genotype-phenotype dataset

## Outputs

- `qc-passed-dataset`: Dataset with failing samples and variants removed
- `qc-report`: Number removed at each step and the applied thresholds

## Process

1. Remove samples with genotyping rate below threshold (typically 0.98) or sex mismatches.
2. Remove variants with call rate below threshold, minor allele frequency below cutoff, or Hardy-Weinberg p-value below threshold in controls.
3. Check for cryptic relatedness and remove one from each related pair (IBD > 0.185).
4. Record the count removed at each step.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
