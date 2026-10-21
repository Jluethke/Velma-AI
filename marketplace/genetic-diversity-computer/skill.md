# Genetic Diversity Computer

Compute diversity and differentiation metrics across populations.

## Inputs

- `filtered-genotypes`: Genotype data
- `allele-frequencies`: Allele frequencies per population

## Outputs

- `diversity-metrics`: Observed and expected heterozygosity, nucleotide diversity (pi), Watterson's theta
- `differentiation-metrics`: Pairwise Fst, Gst, and Jost's D between populations

## Process

1. Compute observed and expected heterozygosity per population
2. Calculate nucleotide diversity (pi) and Watterson's theta if sequence data
3. Compute pairwise Fst between all population pairs (Weir and Cockerham)
4. Calculate Tajima's D to detect deviations from neutral expectations

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
