# Gwas Association Test

Test each variant for association with the phenotype, adjusting for covariates and principal components.

## Inputs

- `qc-passed-dataset`: QC-filtered genotype-phenotype data
- `principal-components`: PCs for stratification correction

## Outputs

- `association-results`: Per-variant test statistics: beta, SE, p-value, allele frequency
- `genomic-inflation`: Lambda GC (genomic inflation factor) and QQ plot

## Process

1. Select the regression model (linear for continuous, logistic for binary phenotype).
2. Include covariates: age, sex, and selected principal components.
3. Run the association test across all QC-passed variants.
4. Compute the genomic inflation factor and generate the QQ plot to check for residual confounding.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
