# Kinetics Rate Equation Writer

Write the system of ordinary differential equations describing the proposed reaction mechanism.

## Inputs

- `reaction-mechanism`: Proposed elementary reactions with stoichiometry
- `species-list`: All chemical species involved (reactants, intermediates, products)

## Outputs

- `ode-system`: Rate equations (dC/dt) for each species
- `parameter-list`: Rate constants to be estimated with their units

## Process

1. For each species, sum the contribution from every elementary reaction it appears in.
2. Apply the law of mass action to write the rate expression for each elementary step.
3. Check stoichiometric consistency: total atoms must balance in each equation.
4. List all rate constants as free parameters with expected order of magnitude.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
