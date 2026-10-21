# Statistical Weight Of Evidence

Calculate the statistical significance of forensic findings using likelihood ratios, random match probabilities, or Bayesian frameworks.

## Inputs

- `lab-results`: Confirmed analytical findings from the QC step
- `population-databases`: Reference population databases for frequency estimation (DNA, fingerprint, etc.)
- `case-context`: Prosecution and defense propositions for likelihood ratio formulation

## Outputs

- `statistical-report`: Calculated random match probability, likelihood ratio, or posterior probability
- `population-frequency`: Frequency of the observed profile or characteristic in reference populations
- `verbal-scale`: Verbal expression of evidential weight following reporting guidelines

## Process

1. Formulate the prosecution and defense propositions clearly
2. Calculate the probability of the evidence under each proposition
3. Compute the likelihood ratio (or equivalent statistic) from the probability pair
4. Express the result on the agreed verbal scale (e.g., weak, moderate, strong, very strong support)
5. Document all assumptions, databases used, and sensitivity to alternative formulations

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
