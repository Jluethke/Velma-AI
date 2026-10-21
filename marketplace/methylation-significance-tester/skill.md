# Methylation Significance Tester

Assess biological significance of methylation changes through pathway analysis and integration with expression data.

## Inputs

- `annotated-dmr-list`: DMRs with gene and feature annotations
- `enrichment-results`: Feature enrichment context

## Outputs

- `pathway-analysis-results`: Enriched pathways and gene ontology terms among DMR-associated genes
- `biological-interpretation`: Summary of which biological processes are affected by methylation changes

## Process

1. Extract genes associated with DMRs (promoter or gene body overlap).
2. Run gene ontology and pathway enrichment analysis (KEGG, Reactome).
3. If expression data is available, correlate methylation changes with expression changes at the same genes.
4. Summarize the biological processes most affected by the observed methylation differences.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
