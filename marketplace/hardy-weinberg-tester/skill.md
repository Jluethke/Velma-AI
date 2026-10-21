# Hardy Weinberg Tester

Test each locus for departure from Hardy-Weinberg equilibrium within each population.

## Inputs

- `filtered-genotypes`: Genotype data
- `allele-frequencies`: Allele frequencies per population

## Outputs

- `hwe-results`: Chi-square or exact test p-values for HWE at each locus per population
- `hwe-deviations`: Loci showing significant departure from HWE, with excess or deficit of heterozygotes

## Process

1. Compute expected genotype frequencies from allele frequencies under HWE
2. Perform exact tests for HWE at each locus within each population
3. Correct for multiple testing
4. Interpret departures (inbreeding, selection, population structure, or genotyping error)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
