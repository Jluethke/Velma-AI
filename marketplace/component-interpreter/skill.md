# Component Interpreter

Interpret what each component or dimension represents by examining loadings, correlations with known variables, and visualizations.

## Inputs

- `loading-matrix`: feature weights per component
- `reduced-representation`: observations in reduced space
- `feature-metadata`: variable names and domain context

## Outputs

- `component-labels`: interpretive labels for each retained component
- `interpretation-evidence`: top-loading features, scatterplots, and correlation tables supporting each label

## Process

1. For each component, rank features by absolute loading and identify the dominant contributors
2. Correlate component scores with external variables or known groupings
3. Produce scatterplots of observations colored by known categories
4. Assign interpretive labels based on the dominant features and domain knowledge

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
