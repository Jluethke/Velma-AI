# Distribution Checker

Check distributional assumptions relevant to planned analyses: normality, homoscedasticity, linearity.

## Inputs

- `treated-dataset`: dataset after outlier treatment
- `analysis-plan`: planned statistical methods and their assumptions

## Outputs

- `assumption-check-report`: Shapiro-Wilk, Levene, QQ plots, and linearity diagnostics per variable or pair
- `transformation-recommendations`: suggested transformations for variables violating assumptions

## Process

1. Test normality (Shapiro-Wilk, Anderson-Darling) and produce QQ plots for key variables
2. Test homoscedasticity (Levene, Breusch-Pagan) where group comparisons or regression are planned
3. Check linearity with scatterplot matrices and LOESS fits for regression predictors
4. Recommend transformations (log, sqrt, Box-Cox) or nonparametric alternatives where assumptions fail

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
