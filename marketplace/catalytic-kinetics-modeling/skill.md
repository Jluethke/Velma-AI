# Catalytic Kinetics Modeling

Develop a kinetic model for the catalytic reaction from experimental data using mechanistic rate expressions.

## Inputs

- `selected-catalyst`: Characterized catalyst
- `characterization-report`: Catalyst properties for transport analysis

## Outputs

- `kinetic-model`: Rate expression with fitted parameters and confidence intervals
- `transport-corrected-rates`: Intrinsic rates corrected for internal and external mass transfer

## Process

1. Verify absence of transport limitations using diagnostic criteria: Weisz-Prater criterion (C_WP = r_obs * rho_p * R^2 / (D_eff * C_s) < 0.3 for less than 5% diffusion limitation), Mears criterion for external mass transfer (r_obs * rho_b * R * n / (k_c * C_b) < 0.15).
2. Propose mechanistic rate expressions: Langmuir-Hinshelwood (surface reaction rate-limiting, competitive or non-competitive adsorption), Eley-Rideal (reaction between adsorbed species and gas-phase species), Mars-van Krevelen (redox mechanism for metal oxide catalysts).
3. Fit rate parameters by nonlinear regression to experimental data collected over a range of temperatures, pressures, and compositions. Use weighted residuals (weight by inverse of expected variance). Report 95% confidence intervals for each parameter.
4. Validate with thermodynamic consistency: at equilibrium, the rate expression must equal zero. The ratio of forward to reverse rate constants must equal the equilibrium constant (Kp). Check that activation energy is physically reasonable for the proposed mechanism (10 to 200 kJ/mol for most catalytic reactions).
5. Test the model against data not used for fitting (validation set). If the model predicts validation data within measurement uncertainty, it is suitable for reactor design. If not, revisit the mechanism or add terms for inhibition by products or poisons.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
