# Behavioral Effect Size Calculator

Compute standardized effect sizes for all significant and planned contrasts.

## Inputs

- `model-results`: Statistical model output
- `subject-summaries`: Summary metrics for effect size calculation

## Outputs

- `effect-sizes`: Cohen's d, partial eta-squared, or generalized eta-squared for each contrast
- `confidence-intervals`: 95% CIs around each effect size estimate

## Process

1. Compute partial eta-squared for omnibus ANOVA effects.
2. Compute Cohen's d (or dz for within-subject) for pairwise contrasts.
3. Compute 95% confidence intervals using non-central F or t distributions.
4. Compare effect sizes against benchmarks (small, medium, large) and against prior literature.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
