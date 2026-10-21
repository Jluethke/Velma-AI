# Pathway Enrichment Analysis

Test gene lists or ranked gene sets against pathway and ontology databases to identify enriched biological processes.

## Inputs

- `call-results`: Significant variants (DNA) or differentially expressed genes (RNA)
- `organism-annotation`: Species and gene annotation database (GO, KEGG, Reactome)

## Outputs

- `enrichment-results`: Enriched pathways and GO terms with p-values, FDR, and gene lists
- `pathway-summary`: Top enriched processes grouped by biological theme

## Process

1. Run over-representation analysis (ORA) on the significant gene set against GO and KEGG
2. Run gene set enrichment analysis (GSEA) on the full ranked gene list for unbiased discovery
3. Correct for multiple testing and filter by FDR < 0.05
4. Group enriched terms by biological theme to reduce redundancy (REVIGO or simplifyEnrichment)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
