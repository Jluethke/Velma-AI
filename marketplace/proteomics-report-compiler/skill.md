# Proteomics Report Compiler

Compile the proteomics report: identification statistics, quantification quality, differential expression results, and pathway enrichment if applicable.

## Inputs

- `protein-groups`: Identified proteins
- `de-results`: Differential expression results
- `normalization-report`: Data quality metrics

## Outputs

- `proteomics-report`: Structured report with figures, tables, and supplementary data
- `protein-list-export`: Exportable table of all identified and quantified proteins

## Process

1. Report identification statistics: total proteins, peptides per protein, sequence coverage.
2. Present the volcano plot and highlight the most significant changes.
3. If pathway databases are available, test for enrichment of functional categories.
4. Export the complete protein list with all statistics for downstream use.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
