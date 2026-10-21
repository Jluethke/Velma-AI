# Tree Rooter

Root the phylogenetic tree using an outgroup, midpoint method, or molecular clock assumption.

## Inputs

- `supported-tree`: Unrooted tree with support values
- `rooting-method`: Outgroup taxon, midpoint, or molecular clock

## Outputs

- `rooted-tree`: Rooted tree with directional branch lengths
- `rooting-rationale`: Justification for the chosen root placement

## Process

1. Identify the outgroup or apply the midpoint/clock criterion.
2. Insert the root at the selected position.
3. Recalculate branch lengths from the root.
4. Document why this rooting is appropriate for the dataset.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
