# Constraint Definer

Define scheduling constraints and sequencing rules.

## Inputs

- `capacity-profile`: Capacity by work center
- `demand-plan`: Demand requirements

## Outputs

- `constraint-set`: All scheduling constraints (changeover, sequence, batch size)
- `sequencing-rules`: Rules for job ordering at each work center

## Process

1. Define changeover times between product types (setup matrix)
2. Identify sequence-dependent constraints (color families, allergen segregation)
3. Set minimum and maximum batch sizes
4. Define operator skill requirements by work center

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
