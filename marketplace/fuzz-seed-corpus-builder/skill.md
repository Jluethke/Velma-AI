# Fuzz Seed Corpus Builder

Build a seed corpus from real inputs and prior cases and measure its baseline coverage.

## Inputs

- `fuzz-targets`: Functions and parsers selected as fuzz targets
- `harness-code`: Harness entry points that drive each fuzz target

## Outputs

- `seed-corpus`: Initial inputs that exercise diverse target paths
- `corpus-coverage-baseline`: Coverage the seed corpus reaches before fuzzing

## Process

1. Collect valid real-world inputs and prior test cases for each target
2. Add minimal structurally valid inputs where real samples are scarce
3. Run the corpus through the harness to record baseline coverage
4. Remove redundant seeds that add no new coverage

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
