# Reaction Kinetics Characterization

Determine the rate law and kinetic parameters for the target reaction from experimental data.

## Inputs

- `reaction-system`: Reactants, products, stoichiometry, and known side reactions
- `experimental-data`: Concentration vs time data from batch or differential reactor experiments

## Outputs

- `rate-law`: Rate expression with reaction orders and rate constant
- `arrhenius-parameters`: Pre-exponential factor A and activation energy Ea from ln(k) vs 1/T plot
- `selectivity-map`: Selectivity to desired product as function of conversion, temperature, and concentration

## Process

1. Plot concentration vs time for batch data. For integral analysis, guess a rate law form, integrate, and linearize to test fit. For differential analysis, compute -dC/dt numerically and plot log(rate) vs log(C) to extract reaction order.
2. Repeat at multiple temperatures. Plot ln(k) vs 1/T (Arrhenius plot). Slope gives -Ea/R, intercept gives ln(A). Check linearity; curvature suggests a change in mechanism or competing reactions.
3. For complex kinetics (consecutive, parallel), fit rate expressions to the full dataset using nonlinear regression. Use Akaike Information Criterion to compare rival models with different numbers of parameters.
4. Map selectivity: for parallel reactions A to P (desired) and A to Q (waste), compute the ratio of rates as a function of concentration and temperature. Identify whether high or low concentration and temperature favor the desired product.
5. Document the valid range of the kinetic model: temperature, concentration, and conversion limits beyond which extrapolation is not supported.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
