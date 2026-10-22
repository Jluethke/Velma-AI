# Eisenhower Place In Quadrant

Place each task in the matrix using the sharpened definitions of important and urgent.

## Inputs

- `urgency-scores`: Each task marked urgent only if a consequence lands within 24 hours.
- `urgency-reasons`: Why each task is or is not urgent.

## Outputs

- `quadrant-map`: Each task placed in one of the four quadrants.
- `quadrant-counts`: How many tasks landed in each quadrant.

## Process

1. Place each task in one of the four quadrants by its two scores.
2. Count how many tasks landed in each quadrant.
3. Note if most tasks crowd the urgent side.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
