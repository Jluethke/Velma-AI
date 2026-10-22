# Frc Lever Finder

Find the burn levers that extend the runway.

## Inputs

- `burn-breakdown`: The burn categories to trim
- `worst-case-runway`: The runway the levers must protect

## Outputs

- `burn-levers`: The categories ranked by size and flexibility
- `extended-runway`: The runway under a realistic set of cuts

## Process

1. Rank the burn categories by size and flexibility.
2. Estimate the runway added by trimming each lever.
3. Show the extended runway under a realistic set of cuts.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
