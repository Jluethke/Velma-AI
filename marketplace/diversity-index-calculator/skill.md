# Diversity Index Calculator

Compute diversity indices: species richness, Shannon entropy, Simpson's index, and evenness for each site and overall.

## Inputs

- `species-abundance-matrix`: Sites-by-species count matrix
- `stratification-plan`: Habitat groupings for comparison

## Outputs

- `diversity-table`: Each site and stratum with richness, Shannon H, Simpson D, and evenness
- `diversity-comparison`: Statistical comparison of diversity between habitats or treatments

## Process

1. Compute species richness (S), Shannon entropy (H'), and Simpson's diversity (1-D) per site.
2. Compute evenness (H'/ln(S)) to measure how equally individuals are distributed among species.
3. Partition diversity into alpha (within-site) and beta (between-site) components.
4. Compare diversity between habitats using rarefaction-based tests or permutation ANOVA.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
