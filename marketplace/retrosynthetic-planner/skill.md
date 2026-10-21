# Retrosynthetic Planner

Decompose the target molecule into available starting materials through retrosynthetic disconnections, scoring each route by step count, yield estimate, and reagent availability.

## Inputs

- `functional-group-map`: Reactive sites and protecting group needs
- `known-routes-summary`: Published routes to compare against
- `stereochemistry-constraints`: Configuration requirements for each center

## Outputs

- `retrosynthetic-tree`: Disconnection tree with scored candidate routes
- `selected-route`: Chosen route with starting materials and estimated step count
- `reagent-list`: All reagents, catalysts, and solvents required

## Process

1. Apply disconnection rules to identify strategic bonds
2. Generate candidate routes as a disconnection tree
3. Score each route on step count, predicted yield, and reagent cost
4. Select the best route and list all required reagents and solvents

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
