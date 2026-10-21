# Codebook Refiner

Refine the codebook based on disagreement patterns: clarify ambiguous definitions, add new anchor examples, split or merge codes as needed.

## Inputs

- `codebook-draft`: The current codebook
- `disagreement-patterns`: Where and why raters disagree
- `confusion-matrix`: Which codes are confused

## Outputs

- `codebook-revised`: Updated codebook with refined definitions and new examples
- `revision-changelog`: What changed and why

## Process

1. For each commonly confused code pair, sharpen the boundary between them.
2. Add anchor examples from the actual disagreement cases.
3. If a code is too broad (high internal confusion), consider splitting it.
4. If two codes are rarely distinguished, consider merging them.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
