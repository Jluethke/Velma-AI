# Allele Frequency Calculator

Calculate allele frequencies and genotype frequencies per population.

## Inputs

- `filtered-genotypes`: QC-passed genotype data
- `sample-metadata`: Population assignments

## Outputs

- `allele-frequencies`: Minor allele frequency per locus per population
- `maf-spectrum`: Site frequency spectrum for each population

## Process

1. Count alleles per locus within each population
2. Compute minor allele frequency and genotype frequencies
3. Build the site frequency spectrum (folded or unfolded)
4. Identify fixed differences and private alleles between populations

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
