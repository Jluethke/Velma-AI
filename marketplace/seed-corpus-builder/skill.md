# Seed Corpus Builder

Create a seed corpus from existing test cases and real-world inputs to bootstrap the fuzzer.

## Inputs

- `fuzz-targets`: Functions to fuzz with their input formats
- `target-codebase`: Source code and existing test suites

## Outputs

- `seed-corpus`: Directory of seed inputs covering the input format's structure
- `corpus-coverage`: Code coverage achieved by the seed corpus alone

## Process

1. Collect valid inputs from existing unit tests, integration tests, and sample files.
2. Minimize the corpus to remove redundant seeds that cover the same code paths.
3. Measure the initial code coverage to establish a baseline.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
