# Scrna Cell Type Annotation

Annotate clusters with cell type identities using marker genes, reference datasets, or automated classifiers.

## Inputs

- `marker-gene-table`: Cluster-specific marker genes
- `cluster-assignments`: Cluster labels to annotate

## Outputs

- `cell-type-labels`: Cell type annotation for each cluster
- `annotation-confidence`: Confidence level for each annotation based on marker overlap and reference agreement

## Process

1. Compare top markers against known cell type markers from published databases (CellMarker, PanglaoDB).
2. If a reference atlas exists for the tissue, project cells onto the reference and transfer labels.
3. Assign cell type labels to clusters where markers unambiguously match a known type.
4. Flag clusters with ambiguous or novel marker profiles for further investigation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
