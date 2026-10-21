# Phylogeny Annotator

Produce the final annotated phylogeny figure with support values, taxonomic labels, scale bar, and legend.

## Inputs

- `annotated-tree`: Tree with taxonomic and support annotations
- `reconciliation-report`: Taxonomy conflicts and novel clades

## Outputs

- `phylogeny-figure`: Publication-ready tree figure with all annotations
- `phylogeny-report`: Summary of methods, model, support, and taxonomic findings

## Process

1. Render the tree with branch lengths proportional to substitutions per site.
2. Add support values, taxonomic color coding, and conflict markers.
3. Include a scale bar and legend.
4. Write the methods and results summary for the phylogeny report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
