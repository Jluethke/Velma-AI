# Line List Compiler

Compile the line list of all cases with demographic, clinical, exposure, and outcome information.

## Inputs

- `case-definition`: Criteria for case classification
- `case-reports`: Individual case reports from surveillance, hospitals, and labs

## Outputs

- `line-list`: Structured table: one row per case with ID, demographics, onset, exposures, outcome
- `attack-rates`: Attack rates by group (age, sex, location, exposure)

## Process

1. Collect case reports from all reporting sources
2. Abstract each case into the line list format with standardized fields
3. Classify each case as confirmed, probable, or suspect
4. Calculate overall and group-specific attack rates

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
