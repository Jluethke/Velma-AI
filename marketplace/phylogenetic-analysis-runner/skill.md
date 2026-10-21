# Phylogenetic Analysis Runner

Build a phylogenetic tree from sequence data: align sequences, select a substitution model, run tree inference, and assess branch support.

## Inputs

- `sequence-dataset`: Cleaned sequences from the sequencing workflow
- `marker-coverage-summary`: Which markers are available

## Outputs

- `phylogenetic-tree`: Best tree with branch support values
- `model-selection-log`: Substitution model comparison and chosen model
- `clade-summary`: Major clades, divergence patterns, and taxonomic implications

## Process

1. Perform multiple sequence alignment (MAFFT or MUSCLE)
2. Select the best substitution model using information criteria
3. Run maximum likelihood or Bayesian tree inference
4. Assess branch support via bootstrap or posterior probability
5. Annotate clades and compare to existing taxonomy

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
