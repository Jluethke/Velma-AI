# Differentially Methylated Region Finder

Identify differentially methylated regions (DMRs) between conditions or groups.

## Inputs

- `cpg-methylation-table`: Per-CpG methylation levels across all samples
- `sample-metadata`: Group assignments for comparison

## Outputs

- `dmr-list`: Regions with significant methylation differences, with coordinates, effect size, and p-values
- `dmr-statistics`: Number of hyper- and hypo-methylated DMRs, effect size distribution

## Process

1. Select the DMR detection method (BSmooth, DMRseq, or methylKit) based on sample count and design.
2. Run the analysis with appropriate multiple testing correction.
3. Filter DMRs by minimum number of CpGs, minimum effect size, and adjusted p-value threshold.
4. Classify DMRs as hyper-methylated or hypo-methylated relative to the reference group.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
