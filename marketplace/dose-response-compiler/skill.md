# Dose Response Compiler

Compile dose-response data from multiple studies and determine the critical study and critical effect.

## Inputs

- `evidence-table`: Table of studies with species, route, dose, and effects
- `hazard-profile`: Hazard profile identifying the endpoints of concern

## Outputs

- `dose-response-dataset`: Structured dose-response data from the critical study
- `critical-effect-summary`: The selected critical effect, its NOAEL or LOAEL, and justification

## Process

1. Rank studies by relevance (species, route, duration, quality)
2. Select the critical study and critical effect based on the most sensitive endpoint
3. Extract dose-response pairs from the critical study
4. Identify the NOAEL, LOAEL, or benchmark dose from the data

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
