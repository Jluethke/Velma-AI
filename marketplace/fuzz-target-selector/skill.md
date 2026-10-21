# Fuzz Target Selector

Select and prioritize fuzz targets from the codebase by input exposure and parsing complexity.

## Inputs

- `codebase-profile`: Structure, languages, and entry points of the codebase
- `input-interfaces`: Interfaces that accept external or untrusted input

## Outputs

- `fuzz-targets`: Functions and parsers selected as fuzz targets
- `target-prioritization`: Targets ranked by exposure and parsing risk

## Process

1. Identify functions that parse or decode untrusted input
2. Rate each candidate by input exposure and parsing complexity
3. Select targets with clear input boundaries suited to fuzzing
4. Rank the selected targets so effort goes to the riskiest first

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
