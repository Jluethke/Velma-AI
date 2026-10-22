# Sysid Model Validation

Validate the identified model against independent data and physical expectations to determine if it is adequate for controller design.

## Inputs

- `parametric-model`: Identified transfer function or state-space model
- `preprocessed-data`: Validation dataset (not used for estimation)
- `frequency-response-estimate`: Nonparametric ground truth
- `control-objectives`: What accuracy is needed for the intended use

## Outputs

- `validated-model`: The model declared fit for use, with documented accuracy limits and valid operating range
- `validation-report`: Fit percentage, residual analysis, frequency response comparison, and identified limitations

## Process

1. Simulate the model with the validation dataset input and compare output to measured output. Report fit percentage (NRMSE). For controller design, 80% or higher is typical; for simulation, 90% or higher.
2. Analyze residuals (difference between model prediction and measurement). Residuals should be white noise: check with autocorrelation (no significant peaks beyond lag 0) and cross-correlation with input (no significant peaks at any lag). Patterned residuals indicate unmodeled dynamics.
3. Overlay the parametric model frequency response on the nonparametric estimate. Agreement within the confidence bounds of the nonparametric estimate is required in the control-relevant frequency range. Disagreement at high frequencies (beyond control bandwidth) is acceptable.
4. Check that the model is physically reasonable: correct DC gain, correct number of resonances, reasonable damping ratios, correct sign of gain, stable if the physical system is stable.
5. If the model will be used for uncertainty-tolerant control, characterize the model uncertainty: compute the multiplicative uncertainty (|G_true - G_model| / |G_model|) at each frequency from the nonparametric estimate. This uncertainty bound feeds directly into the H-infinity or mu-synthesis controller design.
6. Document the valid operating range: input amplitude range, frequency range, operating point. The model is not valid outside the conditions under which it was identified.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
