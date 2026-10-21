# Antimicrobial Susceptibility Test

Determine the antimicrobial susceptibility profile of the isolate using broth microdilution or disk diffusion per CLSI standards.

## Inputs

- `pure-isolate`: Pure culture at known density
- `antibiotic-panel`: Antibiotics and concentration ranges to test

## Outputs

- `susceptibility-profile`: MIC values and S/I/R interpretation for each antibiotic
- `resistance-flags`: Phenotypic resistance patterns warranting further investigation

## Process

1. Prepare inoculum to 0.5 McFarland standard and distribute into broth microdilution plates
2. Incubate for 16-20 hours and read MIC as the lowest concentration with no visible growth
3. Interpret MIC values against CLSI breakpoints for the organism and antibiotic
4. Flag multidrug resistance patterns and inducible resistance phenotypes for genomic follow-up

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
