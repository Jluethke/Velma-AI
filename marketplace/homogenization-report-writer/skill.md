# Homogenization Report Writer

Write the homogenization report: detected breakpoints, their causes, adjustments applied, validation results, and the final record.

## Inputs

- `classified-breakpoints`: All detected breakpoints with causes
- `adjustment-values`: Corrections applied
- `validation-result`: Quality assessment of the homogenized record

## Outputs

- `homogenization-report`: Structured report documenting the entire process
- `homogenized-dataset`: The final homogenized record with adjustment flags

## Process

1. List all detected breakpoints with their dates, magnitudes, and classified causes.
2. Present the adjustments applied at each breakpoint.
3. Show the before/after comparison plots and validation statistics.
4. Provide the homogenized dataset with metadata flags indicating which segments were adjusted.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
