# Vle Data Analysis

Analyze vapor-liquid equilibrium data and select the thermodynamic model for the separation system.

## Inputs

- `component-list`: Components to separate with boiling points and molecular structures
- `operating-pressure`: Column operating pressure or pressure range to evaluate

## Outputs

- `thermodynamic-model`: Selected VLE model with fitted parameters
- `relative-volatility`: Relative volatility as function of composition and pressure
- `azeotrope-identification`: Any azeotropes present with composition and temperature

## Process

1. Classify the system: ideal (Raoult's law applies), moderately non-ideal (activity coefficient model needed), strongly non-ideal (association, electrolyte). Check for azeotropes by examining if relative volatility crosses unity.
2. Select thermodynamic model: NRTL for liquid-liquid and highly non-ideal systems, UNIQUAC for size-different molecules, Wilson for fully miscible systems, SRK or PR equation of state for hydrocarbon and high-pressure systems. Fit binary interaction parameters to experimental VLE data.
3. Validate the model against experimental data: plot x-y diagram, compare bubble and dew point temperatures, check activity coefficients at infinite dilution. Mean absolute deviation in temperature should be less than 1 K and in vapor composition less than 0.01 mole fraction.
4. Calculate relative volatility alpha = (y_A/x_A) / (y_B/x_B) across the composition range. Note where alpha is lowest (pinch region) as this determines the difficulty of the separation. Alpha less than 1.1 makes distillation impractical; consider alternative separation.
5. If azeotropes exist, map the composition space using residue curve maps or distillation boundary analysis. Identify feasible separation sequences and whether pressure-swing, extractive, or azeotropic distillation is needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
