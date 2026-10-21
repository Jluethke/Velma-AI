# Reaction Energy Profiler

Construct the free energy profile of the reaction pathway showing intermediates and transition states.

## Inputs

- `rate-law`: Rate expression with rate constants
- `activation-parameters`: Activation energies or Eyring parameters

## Outputs

- `energy-profile`: Free energy diagram with barriers, intermediates, and products
- `rate-determining-step`: Identification of the highest barrier step

## Process

1. Convert rate constants to free energy barriers using transition state theory
2. Place intermediates at their relative free energies based on equilibrium data if available
3. Construct the energy profile diagram from reactants to products
4. Identify the rate-determining step as the highest energy transition state

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
