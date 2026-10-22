# Inspection Criteria Definer

Define inspection criteria for each incoming material type.

## Inputs

- `material-specifications`: Specifications and tolerances for incoming materials
- `quality-history`: Historical quality data by material and supplier

## Outputs

- `inspection-criteria`: Criteria per material: dimensions, appearance, chemical, functional
- `risk-classification`: Material risk levels (critical, major, minor)

## Process

1. List all incoming material types and their specifications
2. Classify by risk level based on impact if nonconforming
3. Define specific measurements, tests, and acceptance criteria for each
4. Set inspection level (normal, tightened, reduced) by risk class

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
