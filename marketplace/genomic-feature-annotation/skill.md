# Genomic Feature Annotation

Annotate DMRs with genomic features: promoters, enhancers, gene bodies, CpG islands, and regulatory elements.

## Inputs

- `dmr-list`: Differentially methylated regions
- `reference-genome`: Genome build for annotation databases

## Outputs

- `annotated-dmr-list`: DMRs with overlapping genes, promoters, enhancers, and regulatory annotations
- `enrichment-results`: Enrichment of DMRs in specific genomic features vs background

## Process

1. Overlap DMRs with gene annotations (TSS, gene body, intergenic).
2. Annotate with CpG island context (island, shore, shelf, open sea).
3. Overlap with chromatin state maps or enhancer databases if available.
4. Test for enrichment of DMRs in specific genomic features compared to all tested CpGs.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
