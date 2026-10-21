# Randomization Blinding Planner

Plan the randomization scheme and blinding level: simple, stratified, or block randomization; single, double, or triple blinding.

## Inputs

- `confound-control-plan`: Confounder control strategies
- `experiment-description`: Experiment logistics and constraints

## Outputs

- `randomization-protocol`: The randomization method, blocking factors, and allocation ratio
- `blinding-protocol`: Who is blinded, how codes are managed, and when unblinding occurs

## Process

1. Choose a randomization method based on sample size and blocking needs.
2. Define the allocation ratio and any stratification factors.
3. Determine which parties can and should be blinded (subject, operator, analyst).
4. Design the code management procedure: who generates codes, where they are stored, when unblinding occurs.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
