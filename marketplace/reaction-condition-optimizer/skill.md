# Reaction Condition Optimizer

Optimize reaction conditions for each step: solvent, temperature, catalyst loading, reaction time, and workup procedure.

## Inputs

- `selected-route`: The synthesis route to optimize
- `reagent-list`: Available reagents and solvents

## Outputs

- `optimized-conditions`: Solvent, temperature, time, catalyst, and stoichiometry per step
- `workup-procedures`: Extraction, washing, and purification procedure per step
- `safety-notes`: Hazard flags, incompatibilities, and PPE requirements

## Process

1. Set baseline conditions from literature precedent for each reaction type
2. Identify variables to screen (solvent, temperature, catalyst, equivalents)
3. Design a small screening matrix for the most sensitive steps
4. Record optimized conditions and workup for each step
5. Flag hazardous reagents and incompatible combinations

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
