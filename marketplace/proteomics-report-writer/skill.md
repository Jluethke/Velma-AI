# Proteomics Report Writer

Produce the proteomics analysis report with methods, QC, differential results, and pathway findings.

## Inputs

- `enrichment-results`: Pathway enrichment results
- `de-results`: Differential expression results
- `quality-summary`: Acquisition QC metrics

## Outputs

- `proteomics-report`: The full proteomics analysis report
- `supplementary-tables`: Complete protein list, DE table, and enrichment table

## Process

1. Summarize the experimental design and number of identifications at each filtering stage.
2. Present the top differentially expressed proteins with volcano and heatmap visualizations.
3. Present enriched pathways with biological interpretation.
4. List all software versions, parameters, and databases used for reproducibility.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
