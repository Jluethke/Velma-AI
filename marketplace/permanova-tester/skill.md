# Permanova Tester

Test whether community composition differs among groups using permutational multivariate ANOVA.

## Inputs

- `distance-matrix`: Pairwise site dissimilarity matrix
- `group-assignments`: Categorical grouping variable for each site (treatment, habitat, time)

## Outputs

- `permanova-results`: F-statistic, R-squared, and p-value from the permutation test
- `dispersion-test`: PERMDISP results testing homogeneity of group dispersions

## Process

1. Partition the distance matrix sums-of-squares by group using PERMANOVA
2. Run the specified number of permutations (default 999) to generate the null distribution
3. Test multivariate dispersion homogeneity (PERMDISP) to validate PERMANOVA assumptions
4. Report F, R-squared, p-value, and note if dispersion differences complicate interpretation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
