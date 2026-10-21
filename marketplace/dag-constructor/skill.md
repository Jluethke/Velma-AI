# Dag Constructor

Draw the directed acyclic graph (DAG) encoding assumed causal relationships among treatment, outcome, confounders, mediators, and colliders.

## Inputs

- `causal-estimand`: the treatment-outcome pair
- `available-data`: variables in the dataset

## Outputs

- `causal-dag`: DAG with labeled nodes and directed edges
- `variable-roles`: classification of each variable as confounder, mediator, collider, instrumental variable, or irrelevant

## Process

1. List all variables that could influence treatment, outcome, or both
2. Encode assumed causal directions as edges based on domain knowledge and temporal ordering
3. Identify confounders (common causes of treatment and outcome), mediators (on the causal path), and colliders
4. Check the DAG for implied conditional independencies that can be tested in the data

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
