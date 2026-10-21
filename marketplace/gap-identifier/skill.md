# Gap Identifier

Identify gaps in the concept matrix: concepts with few papers, conflicting findings, or missing intersections between related concepts.

## Inputs

- `concept-matrix`: Papers-by-concepts matrix
- `concept-list`: The list of key concepts

## Outputs

- `gap-list`: List of identified gaps with type (sparse, conflicting, missing intersection)
- `contradiction-list`: Pairs of papers with conflicting findings on the same concept

## Process

1. Count papers per concept and flag concepts below a coverage threshold.
2. Identify concept pairs that logically intersect but have no papers addressing both.
3. Identify contradictions: same concept, opposite findings, similar methods.
4. Compile the gap and contradiction lists.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
