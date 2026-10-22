# Sysid Parametric Model Estimation

Fit a parametric model structure to the data using prediction error or subspace methods, selecting model order and structure from the physics and data.

## Inputs

- `preprocessed-data`: Cleaned input-output data for estimation
- `frequency-response-estimate`: Nonparametric estimate to guide model order and validate parametric fit
- `plant-description`: Known physics to guide model structure selection

## Outputs

- `parametric-model`: Transfer function or state-space model with identified parameters and their uncertainty bounds
- `model-selection-rationale`: Why this model structure and order were chosen, and what alternatives were tried

## Process

1. Choose model structure from physics: if the plant is known to have N poles and M zeros, use a transfer function of that order. If the structure is unknown, start with ARX for initial order estimation (it always converges), then refine with OE or BJ.
2. For state-space identification when order is unknown, use subspace identification (N4SID, MOESP) to estimate the order from singular value decay of the Hankel matrix. The gap in singular values indicates the model order.
3. Estimate parameters using prediction error minimization (PEM). Initialize from ARX or subspace estimate to avoid local minima. For OE and BJ models, initialization matters because the cost function is non-convex.
4. Try multiple model orders around the suspected value. Compare using AIC (penalizes complexity less) and BIC (penalizes complexity more). Plot fit percentage vs model order; look for the knee where additional order gives diminishing improvement.
5. For grey-box identification (known structure with unknown parameters): formulate the state-space matrices as functions of physical parameters, use PEM with analytic gradients, and bound parameters to physically meaningful ranges.
6. Extract uncertainty bounds on identified parameters. If uncertainty is large relative to the parameter value, that parameter is not well-identified from this data. Consider redesigning the experiment or simplifying the model.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
