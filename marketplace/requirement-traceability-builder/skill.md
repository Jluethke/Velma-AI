# Requirement Traceability Builder

Build the traceability matrix linking abuse cases to requirements, criteria, and tests as a baseline.

## Inputs

- `prioritized-requirements`: Requirements ordered by risk reduction and cost
- `acceptance-criteria`: Pass or fail conditions for each requirement

## Outputs

- `traceability-matrix`: Links from abuse case to requirement to criteria to test
- `requirements-baseline`: Versioned baseline of the agreed requirement set

## Process

1. Link each abuse case forward to its requirement and acceptance criteria
2. Flag any requirement with no criterion or any abuse case with no requirement
3. Capture the agreed set as a versioned baseline
4. Define how changes to the baseline will be tracked

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
