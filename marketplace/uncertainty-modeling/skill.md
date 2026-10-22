# Uncertainty Modeling

Characterize what is unknown about the plant and represent it mathematically as an uncertainty model compatible with H-infinity and mu-analysis tools.

## Inputs

- `nominal-plant-model`: Best estimate of the plant transfer function or state-space model
- `plant-knowledge-gaps`: What is uncertain: parameter ranges, unmodeled dynamics, nonlinearities, time delays

## Outputs

- `uncertainty-model`: Structured uncertainty (parametric) and unstructured uncertainty (multiplicative or additive weighting functions) bounding the true plant
- `uncertainty-bound-validation`: Evidence that the uncertainty model actually contains the true plant (comparison to experimental data or multiple plant models)

## Process

1. Classify each uncertainty source: parametric (a known parameter with bounded range, like mass +/-10%), unmodeled dynamics (high-frequency behavior not captured by the nominal model), or nonlinearity (gain variation with amplitude).
2. For parametric uncertainty: express each uncertain parameter as p = p_nominal * (1 + delta * w) where delta is a normalized unknown bounded by |delta| <= 1 and w is the fractional uncertainty. Pull out the delta blocks into a diagonal uncertainty matrix.
3. For unmodeled dynamics: determine the multiplicative uncertainty weight W_m(s) such that |G_true(jw) - G_nominal(jw)| / |G_nominal(jw)| <= |W_m(jw)| at all frequencies. W_m is typically small at low frequencies (model is accurate) and grows past 1.0 near and above the model bandwidth. The frequency where |W_m| = 1 sets the maximum achievable closed-loop bandwidth.
4. Validate the uncertainty model: plot the frequency response of multiple plant realizations (from parameter sweeps, different operating points, or experimental data) and verify they all fall within the uncertainty bounds around the nominal model.
5. Formulate the uncertain plant as an LFT (linear fractional transformation): M(s) with the uncertainty block Delta, where Delta is block-diagonal containing all parametric and dynamic uncertainties. This is the standard form for mu-analysis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
