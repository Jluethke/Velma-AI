# Geomechanics Report Generator

Compile all rock mechanics results into a geomechanics investigation report.

## Inputs

- `strength-parameters`: Mohr-Coulomb and Hoek-Brown parameters with confidence intervals
- `rmr-rating`: Rock mass classification scores
- `elastic-properties`: Young's modulus and Poisson's ratio

## Outputs

- `geomechanics-report`: Final report with Mohr diagrams, strength parameters, and rock mass classification
- `test-data-archive`: All stress-strain curves and computed parameters for archival

## Process

1. Assemble Mohr circle diagrams with fitted failure envelopes
2. Tabulate all strength and elastic parameters with specimen details
3. Present rock mass classification results with design implications
4. Package all raw test data and computed values

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
