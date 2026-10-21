# Differential Abundance Tester

Identify taxa that differ significantly between experimental groups.

## Inputs

- `taxonomy-table`: Count table with taxonomic assignments
- `sample-metadata`: Sample grouping and covariates

## Outputs

- `differential-taxa-list`: List of significantly enriched or depleted taxa with effect sizes and adjusted p-values
- `abundance-plots`: Visualization of differential taxa across groups

## Process

1. Select the statistical method (DESeq2, ALDEx2, ANCOM, LEfSe)
2. Run the differential abundance test with appropriate corrections for compositionality
3. Apply multiple testing correction (Benjamini-Hochberg)
4. Produce ranked lists and plots of significant taxa

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
