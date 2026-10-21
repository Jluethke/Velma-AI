# Taxonomy Reconciler

Compare the inferred tree topology against the accepted taxonomy and flag conflicts or novel groupings.

## Inputs

- `rooted-tree`: Rooted phylogenetic tree
- `reference-taxonomy`: Accepted taxonomic classification for the included taxa

## Outputs

- `reconciliation-report`: List of agreements, conflicts, and novel clades relative to accepted taxonomy
- `annotated-tree`: Tree with taxonomic labels and conflict markers

## Process

1. Map each tip label to its accepted taxonomic hierarchy.
2. Check whether each clade in the tree matches a named taxonomic group.
3. Flag paraphyletic or polyphyletic groups.
4. List novel groupings not present in the reference taxonomy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
