# Reaction Kinetics Measurer

Measure reaction kinetics under systematically varied conditions to determine rate laws.

## Inputs

- `temporal-profiles`: Concentration vs time data for reactants and products
- `experimental-conditions`: Temperature, solvent, catalyst loading, and reagent concentrations tested

## Outputs

- `rate-law`: Rate expression with reaction orders for each reactant and the rate constant
- `activation-parameters`: Activation energy (Arrhenius) or enthalpy and entropy of activation (Eyring)

## Process

1. Fit concentration-time data to integrated rate expressions (zeroth, first, second order)
2. Determine reaction order with respect to each reactant by the method of initial rates or excess
3. Measure rate constants at multiple temperatures
4. Construct Arrhenius or Eyring plots to extract activation parameters

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
