# Proteomics Pathway Enrichment

Test whether differentially expressed proteins cluster in known biological pathways or functional categories.

## Inputs

- `de-results`: Differential expression results with gene/protein identifiers
- `pathway-database`: Gene ontology, KEGG, Reactome, or custom pathway annotations

## Outputs

- `enrichment-results`: Enriched pathways with p-values and gene counts
- `pathway-visualization`: Network or bar plot of top enriched terms

## Process

1. Map protein identifiers to gene symbols for annotation lookup.
2. Run over-representation analysis or gene set enrichment analysis.
3. Correct enrichment p-values for multiple testing.
4. Visualize top enriched terms and their member proteins.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
