# Test Coverage Analyzer

Measure how well the test suite covers the attack surface and identify the uncovered gaps.

## Inputs

- `automated-test-scripts`: Scripts that run the automatable test cases
- `attack-surface-map`: Entry points and interfaces exposed to attackers

## Outputs

- `coverage-report`: Coverage of attack surface and threats by the suite
- `coverage-gaps`: Entry points and threats with no covering test

## Process

1. Map each test back to the entry points and threats it exercises
2. Compute coverage across the attack surface and threat inventory
3. List entry points and threats that no test currently covers
4. Rank the gaps by the impact of the threats they leave untested

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
