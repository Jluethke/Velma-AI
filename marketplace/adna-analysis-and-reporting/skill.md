# Adna Analysis And Reporting

Analyze the authenticated aDNA data for population genetics, phylogenetic placement, or phenotype prediction, and compile the final report.

## Inputs

- `filtered-alignments`: Authenticated, quality-filtered alignments
- `authentication-verdict`: Confirmed ancient DNA authentication
- `endogenous-content-report`: Coverage and endogenous content statistics

## Outputs

- `adna-report`: Full ancient DNA analysis report with authentication evidence, population results, and interpretation
- `adna-data-archive`: Raw data, alignments, and analysis scripts packaged for repository submission

## Process

1. Call variants or genotype at diagnostic SNPs depending on coverage
2. Place the individual in a population genetic context (PCA, ADMIXTURE, f-statistics)
3. Interpret the results in the archaeological and historical context of the specimen
4. Package all data and scripts for submission to a public repository (ENA or SRA)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
