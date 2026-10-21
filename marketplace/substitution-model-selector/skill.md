# Substitution Model Selector

Evaluate candidate nucleotide or amino acid substitution models and select the best fit using information criteria.

## Inputs

- `aligned-sequences`: Trimmed multiple sequence alignment
- `data-type`: Nucleotide or protein

## Outputs

- `selected-model`: Best-fit substitution model with parameters
- `model-comparison-table`: AIC, BIC, and log-likelihood for each candidate model

## Process

1. Enumerate candidate models appropriate to the data type (e.g., JC, HKY, GTR for nucleotides).
2. Fit each model to the alignment and compute log-likelihood.
3. Rank models by AIC and BIC.
4. Select the model with the lowest information criterion score.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
