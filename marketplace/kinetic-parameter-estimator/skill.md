# Kinetic Parameter Estimator

Estimate kinetic parameters for thermal events: activation energy, pre-exponential factor, and reaction order using model-free or model-fitting methods.

## Inputs

- `preprocessed-curves`: Thermal curves at multiple heating rates (for model-free methods)
- `transition-table`: Which transition or decomposition step to analyze

## Outputs

- `kinetic-parameters`: Activation energy (Ea), pre-exponential factor (A), and reaction order (n)
- `kinetic-model-fit`: How well the kinetic model describes the observed data

## Process

1. If multiple heating rates are available, use isoconversional methods (Kissinger, Flynn-Wall-Ozawa).
2. Plot ln(heating_rate / Tp^2) vs. 1/Tp (Kissinger) to extract activation energy.
3. If a single heating rate, fit model-fitting equations (nth order, Avrami, autocatalytic).
4. Report Ea with its uncertainty and note the temperature range over which it is valid.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
