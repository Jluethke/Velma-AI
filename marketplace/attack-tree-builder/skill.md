# Attack Tree Builder

Build attack trees that decompose each priority threat into attacker steps and rank the paths.

## Inputs

- `threat-inventory`: Normalized list of threats with affected assets
- `attack-surface-map`: Entry points and interfaces exposed to attackers

## Outputs

- `attack-trees`: Goal-to-step decompositions for each threat
- `attack-path-rankings`: Paths ranked by feasibility and impact

## Process

1. Set each priority threat as the root goal of an attack tree
2. Decompose the goal into sub-goals and leaf attacker actions
3. Rank each root-to-leaf path by feasibility and impact
4. Mark the paths that most warrant dedicated test cases

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
