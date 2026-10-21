# Tree Builder Ml Bayes

Infer a phylogenetic tree using maximum likelihood or Bayesian methods under the selected substitution model.

## Inputs

- `aligned-sequences`: Trimmed multiple sequence alignment
- `selected-model`: Substitution model with parameters
- `inference-method`: Maximum likelihood or Bayesian MCMC

## Outputs

- `inferred-tree`: Newick-format tree topology with branch lengths
- `inference-log`: Convergence diagnostics, run time, and likelihood scores

## Process

1. Configure the tree search with the selected model and inference method.
2. Run the analysis (ML heuristic search or MCMC chain).
3. Check convergence (likelihood plateau for ML, ESS and trace plots for Bayesian).
4. Extract the best tree (highest likelihood or majority-rule consensus).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
