# Population Structure Inferer

Infer population structure and admixture proportions.

## Inputs

- `filtered-genotypes`: Genotype data
- `sample-metadata`: Known population labels for comparison

## Outputs

- `structure-results`: Admixture proportions (Q-matrix) at the best K, with cross-validation error
- `popgen-report`: Full population genetics report with all metrics, structure, and selection results

## Process

1. Run PCA to visualize population clustering in genetic space
2. Run ADMIXTURE or STRUCTURE across a range of K values
3. Select the best K by cross-validation error or BIC
4. Compile the full population genetics report with diversity, differentiation, structure, and selection results

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
