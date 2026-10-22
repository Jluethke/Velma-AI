# Ouu Uncertainty Characterization

Characterize the uncertain inputs and separate what is random from what is merely unknown, because the formulation and the solver depend on which kind of uncertainty dominates.

## Inputs

- `design-problem`: The design variables, performance model, and the constraints the design must meet
- `data-and-knowledge`: Measurements, expert judgment, and physics that inform the input uncertainty

## Outputs

- `uncertainty-model`: Distributions or intervals for each uncertain input with correlations
- `uncertainty-type-split`: Which uncertainties are aleatory (random) and which are epistemic (reducible lack of knowledge)

## Process

1. Separate aleatory from epistemic uncertainty. Aleatory uncertainty is the inherent randomness of an input (manufacturing scatter, load variability) and is represented by a distribution; epistemic uncertainty is lack of knowledge (an uncertain model parameter, a distribution whose parameters are themselves uncertain) and is often represented by an interval or a distribution over distributions. The split changes whether you take an expectation or a worst case.
2. Fit distributions to the aleatory inputs. Use lognormal for positive multiplicative quantities, normal for additive errors, Weibull or extreme-value distributions for strength and peak loads; fit from data where it exists and from physics or standards where it does not, and record the sample size behind each fit.
3. Capture correlation between inputs. Estimate a correlation matrix or fit a copula; correlated loads and strengths change tail probabilities substantially, and assuming independence can make a design look far safer or riskier than it is.
4. Quantify epistemic uncertainty honestly as a range, not a false distribution. When a parameter is simply poorly known, carry it as an interval and plan a worst-case treatment, or place a distribution on it and plan a nested loop; do not disguise ignorance as a tight Gaussian that understates the true uncertainty.
5. Rank inputs by their contribution to output variance with a quick sensitivity screen. A variance-based sensitivity index or a simple one-at-a-time screen identifies the few inputs that drive the output, so the formulation and sampling effort concentrate there rather than spreading thin over inputs that barely matter.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
