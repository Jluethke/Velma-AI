# Gwas Multiple Testing Adjustment

Adjust association p-values for the large number of tests performed.

## Inputs

- `association-results`: Raw per-variant association statistics

## Outputs

- `adjusted-results`: Variants with genome-wide significance flag and FDR q-values
- `manhattan-plot-data`: Data for Manhattan plot with significance thresholds marked

## Process

1. Apply genome-wide significance threshold (5e-8 for common GWAS).
2. Compute Benjamini-Hochberg FDR q-values for a suggestive tier.
3. Identify independent lead SNPs by clumping in LD windows.
4. Prepare Manhattan plot data with chromosome positions and negative log p-values.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
