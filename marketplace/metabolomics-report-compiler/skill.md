# Metabolomics Report Compiler

Compile the metabolomics study into a report with methods, quality metrics, identified metabolites, and biological interpretation.

## Inputs

- `significant-metabolites`: Metabolites driving group separation
- `multivariate-results`: PCA and PLS-DA results
- `identification-evidence`: Identification confidence levels

## Outputs

- `metabolomics-report`: Complete metabolomics study report
- `pathway-context`: Mapping of significant metabolites to biological pathways (KEGG, Reactome)

## Process

1. Structure the report: sample prep, acquisition, processing, identification, statistics, biology
2. Embed key figures (PCA, PLS-DA, volcano plot, heatmap, pathway map)
3. Map significant metabolites to biological pathways for interpretation
4. State the conclusions with the strength and limitations of the evidence

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
