# First Principles Assumption Classification

Sort each assumption into a fundamental truth or an inherited convention. A fundamental truth is required by a law of physics, math, or economics. A convention is just how things have been done.

## Inputs

- `assumption-list`: Every assumption behind the current approach
- `assumption-count`: How many distinct assumptions were surfaced

## Outputs

- `classified-assumptions`: Each assumption tagged as fundamental truth or convention, with a one-line reason
- `convention-list`: The subset of assumptions that are only convention

## Process

1. For each assumption, ask whether it is required by a physical, mathematical, or economic law, or is just customary.
2. Tag it as a fundamental truth only if breaking it breaks a real law. Otherwise tag it convention.
3. Write a one-line reason for each tag so the call can be checked later.
4. Collect every convention into a separate list. These are the candidates for removal.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
