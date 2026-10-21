# Branch Support Assessor

Assess confidence in each branch of the inferred tree using bootstrap resampling or posterior probabilities.

## Inputs

- `inferred-tree`: Newick-format tree from the inference step
- `aligned-sequences`: Trimmed multiple sequence alignment
- `support-method`: Bootstrap replicates count or Bayesian posterior source

## Outputs

- `supported-tree`: Tree with support values annotated on each internal node
- `support-summary`: Distribution of support values and count of well-supported nodes

## Process

1. Generate bootstrap replicates or extract posterior tree sample.
2. Map support values onto each internal node of the best tree.
3. Classify nodes as well-supported (above threshold) or weakly supported.
4. Summarize the overall support distribution.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
