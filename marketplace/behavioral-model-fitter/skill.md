# Behavioral Model Fitter

Fit the primary statistical model to test the experimental hypotheses.

## Inputs

- `subject-summaries`: Summary metrics per subject per condition
- `design-spec`: Experimental factors and hypothesized contrasts

## Outputs

- `model-results`: ANOVA or mixed model output with F-statistics, p-values, and degrees of freedom
- `assumption-checks`: Normality, sphericity, and homogeneity of variance tests

## Process

1. Select the model: repeated-measures ANOVA, mixed-effects model, or Bayesian equivalent.
2. Check assumptions: normality of residuals (Shapiro-Wilk), sphericity (Mauchly), homogeneity of variance (Levene).
3. Apply corrections if assumptions are violated (Greenhouse-Geisser, heteroscedasticity-consistent standard errors).
4. Run the model and extract main effects and interactions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
